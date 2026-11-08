import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RecordPaymentDto, CreatePaymentCheckoutDto } from './dto/payment.dto';
import { toFixed2 } from '../common/utils/decimal.util';
import { InvoiceStatus, PaymentStatus } from '@prisma/client';
import { randomUUID } from 'crypto';

@Injectable()
export class PaymentsService {
  constructor(private prisma: PrismaService) {}

  async recordManualPayment(companyId: string, dto: RecordPaymentDto) {
    const invoice = await this.prisma.invoice.findFirst({
      where: { id: dto.invoiceId, companyId },
    });

    if (!invoice) {
      throw new NotFoundException('Invoice not found');
    }

    if (invoice.status === InvoiceStatus.PAID) {
      throw new BadRequestException('Invoice is already fully paid.');
    }

    if (invoice.status === InvoiceStatus.CANCELLED) {
      throw new BadRequestException('Cannot record payment against a cancelled invoice.');
    }

    const payAmount = toFixed2(dto.amount);
    if (payAmount <= 0) {
      throw new BadRequestException('Payment amount must be greater than zero.');
    }

    const currentPaid = Number(invoice.paidAmount);
    const invoiceTotal = Number(invoice.totalAmount);
    const newPaidTotal = toFixed2(currentPaid + payAmount);
    const newOutstanding = toFixed2(Math.max(0, invoiceTotal - newPaidTotal));

    let newStatus: InvoiceStatus = InvoiceStatus.PARTIALLY_PAID;
    if (newOutstanding <= 0) {
      newStatus = InvoiceStatus.PAID;
    }

    return this.prisma.$transaction(async (tx) => {
      const payment = await tx.payment.create({
        data: {
          companyId,
          invoiceId: invoice.id,
          amount: payAmount,
          currency: dto.currency || invoice.currency,
          paymentDate: new Date(dto.paymentDate),
          paymentMethod: dto.paymentMethod,
          transactionReference: dto.transactionReference || null,
          notes: dto.notes || null,
          status: PaymentStatus.COMPLETED,
        },
      });

      await tx.invoice.update({
        where: { id: invoice.id },
        data: {
          paidAmount: newPaidTotal,
          outstandingBalance: newOutstanding,
          status: newStatus,
        },
      });

      return payment;
    });
  }

  async findAll(companyId: string, invoiceId?: string) {
    const whereClause: any = { companyId };
    if (invoiceId) {
      whereClause.invoiceId = invoiceId;
    }

    return this.prisma.payment.findMany({
      where: whereClause,
      include: {
        invoice: {
          select: {
            id: true,
            invoiceNumber: true,
            totalAmount: true,
            status: true,
            customer: {
              select: { name: true, companyName: true },
            },
          },
        },
      },
      orderBy: { paymentDate: 'desc' },
    });
  }

  async findOne(companyId: string, id: string) {
    const payment = await this.prisma.payment.findFirst({
      where: { id, companyId },
      include: {
        invoice: {
          include: { customer: true },
        },
      },
    });

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    return payment;
  }

  async deletePayment(companyId: string, id: string) {
    const payment = await this.findOne(companyId, id);

    if (payment.invoiceId) {
      const invoice = await this.prisma.invoice.findUnique({
        where: { id: payment.invoiceId },
      });

      if (invoice) {
        const newPaid = toFixed2(Math.max(0, Number(invoice.paidAmount) - Number(payment.amount)));
        const newOutstanding = toFixed2(Number(invoice.totalAmount) - newPaid);

        let newStatus: InvoiceStatus = invoice.status;
        if (newPaid <= 0) {
          newStatus = InvoiceStatus.ISSUED;
        } else if (newOutstanding > 0) {
          newStatus = InvoiceStatus.PARTIALLY_PAID;
        }

        await this.prisma.$transaction([
          this.prisma.payment.delete({ where: { id } }),
          this.prisma.invoice.update({
            where: { id: invoice.id },
            data: {
              paidAmount: newPaid,
              outstandingBalance: newOutstanding,
              status: newStatus,
            },
          }),
        ]);

        return { message: 'Payment record deleted and invoice balance recalculated.' };
      }
    }

    await this.prisma.payment.delete({ where: { id } });
    return { message: 'Payment record deleted.' };
  }

  // Payment gateway adapter stub for online checkout
  async createOnlineCheckoutSession(token: string, dto: CreatePaymentCheckoutDto) {
    const invoice = await this.prisma.invoice.findUnique({
      where: { publicToken: token },
    });

    if (!invoice) {
      throw new NotFoundException('Invoice not found');
    }

    const payAmount = dto.amount || Number(invoice.outstandingBalance);
    const checkoutSessionId = `chk_${randomUUID()}`;

    return {
      sessionId: checkoutSessionId,
      amount: payAmount,
      currency: invoice.currency,
      invoiceNumber: invoice.invoiceNumber,
      provider: dto.gateway || 'stripe_adapter',
      checkoutUrl: `https://checkout.invoiceai.com/pay/${checkoutSessionId}`,
    };
  }
}

