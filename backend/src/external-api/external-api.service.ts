import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../notifications/mail.service';
import { PdfService } from '../pdf/pdf.service';
import {
  CreateExternalInvoiceDto,
  ExternalCustomerDto,
  RecordExternalPaymentDto,
} from './dto/external-invoice.dto';
import { calculateInvoiceTotals, toFixed2 } from '../common/utils/decimal.util';
import { generateNextInvoiceNumber } from '../common/utils/invoice-number.util';
import { InvoiceStatus, PaymentStatus, PaymentMethod } from '@prisma/client';
import { randomUUID } from 'crypto';

@Injectable()
export class ExternalApiService {
  private readonly logger = new Logger(ExternalApiService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly mailService: MailService,
    private readonly pdfService: PdfService,
  ) {}

  async ping(company: any) {
    return {
      status: 'ok',
      message: 'InvoiceAI API connectivity verified successfully',
      timestamp: new Date().toISOString(),
      company: {
        id: company.id,
        name: company.name,
        email: company.email,
        phone: company.phone,
        currency: company.defaultCurrency,
        country: company.country,
        website: company.website,
      },
    };
  }

  async createInvoice(companyId: string, dto: CreateExternalInvoiceDto) {
    if (!dto.items || dto.items.length === 0) {
      throw new BadRequestException('At least one line item is required.');
    }

    const company = await this.prisma.company.findUnique({
      where: { id: companyId },
    });
    if (!company) {
      throw new NotFoundException('Company not found.');
    }

    // 1. Resolve or Create Customer
    let customer = null;
    const custEmail = dto.customer.email?.trim().toLowerCase();
    const custName = dto.customer.name.trim();

    if (custEmail) {
      customer = await this.prisma.customer.findFirst({
        where: { companyId, email: custEmail },
      });
    }

    if (!customer) {
      customer = await this.prisma.customer.findFirst({
        where: { companyId, name: custName },
      });
    }

    if (!customer) {
      customer = await this.prisma.customer.create({
        data: {
          companyId,
          name: custName,
          email: custEmail || null,
          phone: dto.customer.phone?.trim() || null,
          companyName: dto.customer.companyName?.trim() || null,
          address1: dto.customer.address?.trim() || null,
          city: dto.customer.city?.trim() || null,
          state: dto.customer.state?.trim() || null,
          postalCode: dto.customer.postalCode?.trim() || null,
          country: dto.customer.country?.trim() || company.country || null,
        },
      });
    } else {
      // Update missing customer contact details if provided in request
      const updateData: any = {};
      if (dto.customer.phone && !customer.phone) updateData.phone = dto.customer.phone.trim();
      if (dto.customer.address && !customer.address1) updateData.address1 = dto.customer.address.trim();
      if (dto.customer.city && !customer.city) updateData.city = dto.customer.city.trim();
      if (dto.customer.country && !customer.country) updateData.country = dto.customer.country.trim();

      if (Object.keys(updateData).length > 0) {
        customer = await this.prisma.customer.update({
          where: { id: customer.id },
          data: updateData,
        });
      }
    }

    // 2. Generate Invoice Number
    const invoiceNumber = await generateNextInvoiceNumber(this.prisma, companyId);

    // 3. Decimal Calculations
    const formattedItems = dto.items.map((item) => ({
      name: item.name.trim(),
      description: item.description?.trim() || undefined,
      quantity: Number(item.quantity),
      unitPrice: Number(item.unitPrice),
      discountRate: item.discountRate ? Number(item.discountRate) : 0,
      taxRate: item.taxRate ? Number(item.taxRate) : 0,
    }));

    const totals = calculateInvoiceTotals({
      items: formattedItems,
      discountType: 'FIXED',
      discountValue: dto.discountAmount ? Number(dto.discountAmount) : 0,
      shippingAmount: dto.shippingAmount ? Number(dto.shippingAmount) : 0,
      paidAmount: 0,
    });

    // 4. Default dates and terms
    const issueDate = dto.issueDate ? new Date(dto.issueDate) : new Date();
    let dueDate = dto.dueDate ? new Date(dto.dueDate) : null;
    if (!dueDate || isNaN(dueDate.getTime())) {
      dueDate = new Date(issueDate);
      dueDate.setDate(dueDate.getDate() + 14); // 14-day default
    }

    const currency = dto.currency?.trim() || company.defaultCurrency || 'USD';
    const notes = dto.notes?.trim() || company.defaultInvoiceFooter || null;
    const terms = dto.termsAndConditions?.trim() || company.defaultPaymentTerms || null;
    const paymentInstructions = company.bankDetails || company.defaultPaymentTerms || null;

    const autoIssue = dto.autoIssue !== false; // Default true for API / e-commerce
    const initialStatus = autoIssue ? InvoiceStatus.ISSUED : InvoiceStatus.DRAFT;
    const publicToken = randomUUID();

    // 5. Create Invoice in Database
    const invoice = await this.prisma.invoice.create({
      data: {
        companyId,
        customerId: customer.id,
        invoiceNumber,
        referenceNumber: dto.referenceNumber?.trim() || null,
        issueDate,
        dueDate,
        currency,
        status: initialStatus,
        subtotal: totals.subtotal,
        discountType: 'FIXED',
        discountValue: dto.discountAmount ? Number(dto.discountAmount) : 0,
        discountAmount: totals.discountAmount + totals.itemDiscountAmount,
        taxAmount: totals.taxAmount,
        shippingAmount: totals.shippingAmount,
        totalAmount: totals.totalAmount,
        paidAmount: 0,
        outstandingBalance: totals.totalAmount,
        notes,
        termsAndConditions: terms,
        paymentInstructions,
        templateName: 'MODERN',
        isAiGenerated: false,
        publicToken,
        items: {
          create: totals.calculatedItems.map((item, idx) => {
            const rawItem = dto.items[idx];
            return {
              name: rawItem.name,
              description: rawItem.description || null,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              discountRate: item.discountRate,
              taxRate: item.taxRate,
              lineTotal: item.lineTotal,
              sortOrder: idx,
            };
          }),
        },
      },
      include: {
        customer: true,
        items: { orderBy: { sortOrder: 'asc' } },
      },
    });

    const appUrl = (process.env.APP_URL || 'http://localhost:5173').replace(/\/$/, '');
    const apiBaseUrl = (process.env.BACKEND_URL || 'http://localhost:4000').replace(/\/$/, '');

    // 6. Optional Email Delivery
    let emailSent = false;
    if (dto.sendEmail && customer.email && autoIssue) {
      try {
        await this.mailService.sendInvoiceEmail(invoice.id, companyId);
        emailSent = true;
      } catch (err: any) {
        this.logger.error(`Failed to send invoice email via API: ${err.message}`);
      }
    }

    return {
      success: true,
      message: 'Invoice created successfully',
      invoice: {
        id: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        referenceNumber: invoice.referenceNumber,
        status: invoice.status,
        currency: invoice.currency,
        issueDate: invoice.issueDate,
        dueDate: invoice.dueDate,
        subtotal: invoice.subtotal,
        discountAmount: invoice.discountAmount,
        taxAmount: invoice.taxAmount,
        shippingAmount: invoice.shippingAmount,
        totalAmount: invoice.totalAmount,
        paidAmount: invoice.paidAmount,
        outstandingBalance: invoice.outstandingBalance,
        publicToken: invoice.publicToken,
        publicUrl: `${appUrl}/view-invoice/${invoice.publicToken}`,
        pdfDownloadUrl: `${apiBaseUrl}/api/v1/invoices/${invoice.id}/pdf`,
        emailSent,
        customer: {
          id: customer.id,
          name: customer.name,
          email: customer.email,
          phone: customer.phone,
        },
        items: invoice.items.map((i) => ({
          name: i.name,
          quantity: Number(i.quantity),
          unitPrice: Number(i.unitPrice),
          lineTotal: Number(i.lineTotal),
        })),
        createdAt: invoice.createdAt,
      },
    };
  }

  async listInvoices(
    companyId: string,
    query: { page?: number; limit?: number; status?: string; search?: string },
  ) {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(query.limit) || 20));
    const skip = (page - 1) * limit;

    const where: any = { companyId };
    if (query.status && query.status !== 'ALL') {
      where.status = query.status;
    }
    if (query.search?.trim()) {
      const s = query.search.trim();
      where.OR = [
        { invoiceNumber: { contains: s } },
        { referenceNumber: { contains: s } },
        { customer: { name: { contains: s } } },
        { customer: { email: { contains: s } } },
      ];
    }

    const [total, invoices] = await Promise.all([
      this.prisma.invoice.count({ where }),
      this.prisma.invoice.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          customer: {
            select: { id: true, name: true, email: true, phone: true },
          },
        },
      }),
    ]);

    const appUrl = (process.env.APP_URL || 'http://localhost:5173').replace(/\/$/, '');
    const apiBaseUrl = (process.env.BACKEND_URL || 'http://localhost:4000').replace(/\/$/, '');

    return {
      success: true,
      data: invoices.map((inv) => ({
        id: inv.id,
        invoiceNumber: inv.invoiceNumber,
        referenceNumber: inv.referenceNumber,
        status: inv.status,
        currency: inv.currency,
        issueDate: inv.issueDate,
        dueDate: inv.dueDate,
        totalAmount: inv.totalAmount,
        paidAmount: inv.paidAmount,
        outstandingBalance: inv.outstandingBalance,
        publicUrl: inv.publicToken ? `${appUrl}/view-invoice/${inv.publicToken}` : null,
        pdfDownloadUrl: `${apiBaseUrl}/api/v1/invoices/${inv.id}/pdf`,
        customer: inv.customer,
        createdAt: inv.createdAt,
      })),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getInvoice(companyId: string, idOrNumber: string) {
    const invoice = await this.prisma.invoice.findFirst({
      where: {
        companyId,
        OR: [{ id: idOrNumber }, { invoiceNumber: idOrNumber }],
      },
      include: {
        customer: true,
        items: { orderBy: { sortOrder: 'asc' } },
        payments: {
          where: { status: 'COMPLETED' },
          orderBy: { paymentDate: 'desc' },
        },
      },
    });

    if (!invoice) {
      throw new NotFoundException(`Invoice "${idOrNumber}" not found.`);
    }

    const appUrl = (process.env.APP_URL || 'http://localhost:5173').replace(/\/$/, '');
    const apiBaseUrl = (process.env.BACKEND_URL || 'http://localhost:4000').replace(/\/$/, '');

    return {
      success: true,
      invoice: {
        ...invoice,
        publicUrl: invoice.publicToken ? `${appUrl}/view-invoice/${invoice.publicToken}` : null,
        pdfDownloadUrl: `${apiBaseUrl}/api/v1/invoices/${invoice.id}/pdf`,
      },
    };
  }

  async getInvoicePdfBuffer(companyId: string, idOrNumber: string): Promise<{ buffer: Buffer; invoiceNumber: string }> {
    const invoice = await this.prisma.invoice.findFirst({
      where: {
        companyId,
        OR: [{ id: idOrNumber }, { invoiceNumber: idOrNumber }],
      },
      select: { id: true, invoiceNumber: true },
    });

    if (!invoice) {
      throw new NotFoundException(`Invoice "${idOrNumber}" not found.`);
    }

    const buffer = await this.pdfService.generateInvoicePdf(invoice.id, companyId);
    return { buffer, invoiceNumber: invoice.invoiceNumber };
  }

  async recordPayment(companyId: string, invoiceIdOrNumber: string, dto: RecordExternalPaymentDto) {
    const invoice = await this.prisma.invoice.findFirst({
      where: {
        companyId,
        OR: [{ id: invoiceIdOrNumber }, { invoiceNumber: invoiceIdOrNumber }],
      },
    });

    if (!invoice) {
      throw new NotFoundException(`Invoice "${invoiceIdOrNumber}" not found.`);
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

    let paymentMethod: PaymentMethod = PaymentMethod.ONLINE_GATEWAY;
    if (dto.paymentMethod) {
      const upper = dto.paymentMethod.toUpperCase().replace(/\s+/g, '_');
      if (Object.values(PaymentMethod).includes(upper as PaymentMethod)) {
        paymentMethod = upper as PaymentMethod;
      } else if (upper.includes('CARD') || upper.includes('STRIPE')) {
        paymentMethod = PaymentMethod.CREDIT_CARD;
      } else if (upper.includes('BANK') || upper.includes('TRANSFER')) {
        paymentMethod = PaymentMethod.BANK_TRANSFER;
      } else if (upper.includes('CASH')) {
        paymentMethod = PaymentMethod.CASH;
      } else {
        paymentMethod = PaymentMethod.OTHER;
      }
    }

    const paymentDate = dto.paymentDate ? new Date(dto.paymentDate) : new Date();

    const payment = await this.prisma.$transaction(async (tx) => {
      const p = await tx.payment.create({
        data: {
          companyId,
          invoiceId: invoice.id,
          amount: payAmount,
          currency: invoice.currency,
          paymentDate,
          paymentMethod,
          transactionReference: dto.transactionReference?.trim() || null,
          notes: dto.notes?.trim() || 'Recorded via External API',
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

      return p;
    });

    return {
      success: true,
      message: `Payment of ${invoice.currency} ${payAmount} recorded successfully.`,
      paymentId: payment.id,
      invoiceNumber: invoice.invoiceNumber,
      newStatus,
      paidAmount: newPaidTotal,
      outstandingBalance: newOutstanding,
    };
  }

  async sendInvoiceEmail(companyId: string, invoiceIdOrNumber: string, recipient?: string) {
    const invoice = await this.prisma.invoice.findFirst({
      where: {
        companyId,
        OR: [{ id: invoiceIdOrNumber }, { invoiceNumber: invoiceIdOrNumber }],
      },
      select: { id: true, invoiceNumber: true },
    });

    if (!invoice) {
      throw new NotFoundException(`Invoice "${invoiceIdOrNumber}" not found.`);
    }

    const result = await this.mailService.sendInvoiceEmail(invoice.id, companyId, recipient);
    return {
      success: true,
      message: result.message,
      recipient: result.recipient,
      invoiceNumber: invoice.invoiceNumber,
    };
  }

  async listCustomers(companyId: string, search?: string, limit = 50) {
    const where: any = { companyId };
    if (search?.trim()) {
      where.OR = [
        { name: { contains: search.trim() } },
        { email: { contains: search.trim() } },
        { phone: { contains: search.trim() } },
      ];
    }

    const customers = await this.prisma.customer.findMany({
      where,
      take: Math.min(100, limit),
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        companyName: true,
        address1: true,
        city: true,
        state: true,
        postalCode: true,
        country: true,
        createdAt: true,
      },
    });

    return {
      success: true,
      count: customers.length,
      customers,
    };
  }

  async createOrUpdateCustomer(companyId: string, dto: ExternalCustomerDto) {
    if (!dto.name?.trim()) {
      throw new BadRequestException('Customer name is required.');
    }

    const email = dto.email?.trim().toLowerCase();
    let customer = null;

    if (email) {
      customer = await this.prisma.customer.findFirst({
        where: { companyId, email },
      });
    }

    if (!customer) {
      customer = await this.prisma.customer.findFirst({
        where: { companyId, name: dto.name.trim() },
      });
    }

    const dataPayload = {
      name: dto.name.trim(),
      email: email || null,
      phone: dto.phone?.trim() || null,
      companyName: dto.companyName?.trim() || null,
      address1: dto.address?.trim() || null,
      city: dto.city?.trim() || null,
      state: dto.state?.trim() || null,
      postalCode: dto.postalCode?.trim() || null,
      country: dto.country?.trim() || null,
    };

    if (customer) {
      customer = await this.prisma.customer.update({
        where: { id: customer.id },
        data: dataPayload,
      });
      return {
        success: true,
        action: 'updated',
        customer,
      };
    } else {
      customer = await this.prisma.customer.create({
        data: {
          companyId,
          ...dataPayload,
        },
      });
      return {
        success: true,
        action: 'created',
        customer,
      };
    }
  }
}
