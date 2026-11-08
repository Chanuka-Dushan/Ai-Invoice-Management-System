import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateInvoiceDto, UpdateInvoiceDto } from './dto/invoice.dto';
import { calculateInvoiceTotals, toFixed2 } from '../common/utils/decimal.util';
import { generateNextInvoiceNumber } from '../common/utils/invoice-number.util';
import { InvoiceStatus } from '@prisma/client';
import { randomUUID } from 'crypto';

@Injectable()
export class InvoicesService {
  constructor(private prisma: PrismaService) {}

  async create(companyId: string, dto: CreateInvoiceDto, isAiGenerated = false, aiPromptUsed?: string) {
    // 1. Verify customer belongs to company
    const customer = await this.prisma.customer.findFirst({
      where: { id: dto.customerId, companyId },
    });

    if (!customer) {
      throw new BadRequestException('Selected customer does not exist in this company.');
    }

    // 2. Fetch company defaults if fields omitted
    const company = await this.prisma.company.findUnique({
      where: { id: companyId },
    });

    if (!company) {
      throw new NotFoundException('Company not found');
    }

    // 3. Invoice Number generation
    let invoiceNumber = dto.invoiceNumber?.trim();
    if (!invoiceNumber) {
      invoiceNumber = await generateNextInvoiceNumber(this.prisma, companyId);
    } else {
      // Check uniqueness
      const existing = await this.prisma.invoice.findUnique({
        where: {
          companyId_invoiceNumber: {
            companyId,
            invoiceNumber,
          },
        },
      });
      if (existing) {
        throw new ConflictException(`Invoice number "${invoiceNumber}" is already in use.`);
      }
    }

    // 4. Validate items
    if (!dto.items || dto.items.length === 0) {
      throw new BadRequestException('An invoice must have at least one line item.');
    }

    // 5. Backend calculations
    const totals = calculateInvoiceTotals({
      items: dto.items,
      discountType: dto.discountType || 'PERCENTAGE',
      discountValue: dto.discountValue || 0,
      shippingAmount: dto.shippingAmount || 0,
      paidAmount: 0,
    });

    // 6. Populate default terms/instructions if omitted
    const paymentInstructions =
      dto.paymentInstructions ?? company.bankDetails ?? company.defaultPaymentTerms;
    const termsAndConditions = dto.termsAndConditions ?? company.defaultPaymentTerms;
    const notes = dto.notes ?? company.defaultInvoiceFooter;
    const currency = dto.currency || company.defaultCurrency || 'USD';

    // 7. Save in transaction
    const invoice = await this.prisma.invoice.create({
      data: {
        companyId,
        customerId: customer.id,
        invoiceNumber,
        referenceNumber: dto.referenceNumber || null,
        issueDate: new Date(dto.issueDate),
        dueDate: new Date(dto.dueDate),
        currency,
        status: dto.status || InvoiceStatus.DRAFT,
        subtotal: totals.subtotal,
        discountType: dto.discountType || 'PERCENTAGE',
        discountValue: dto.discountValue || 0,
        discountAmount: totals.discountAmount + totals.itemDiscountAmount,
        taxAmount: totals.taxAmount,
        shippingAmount: totals.shippingAmount,
        totalAmount: totals.totalAmount,
        paidAmount: 0,
        outstandingBalance: totals.totalAmount,
        notes: notes || null,
        termsAndConditions: termsAndConditions || null,
        paymentInstructions: paymentInstructions || null,
        templateName: dto.templateName || 'MODERN',
        isAiGenerated,
        aiPromptUsed: aiPromptUsed || null,
        publicToken: randomUUID(),
        items: {
          create: totals.calculatedItems.map((item, idx) => {
            const rawItem = dto.items[idx];
            return {
              productId: rawItem.productId || null,
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
        items: true,
        company: true,
      },
    });

    return invoice;
  }

  async findAll(
    companyId: string,
    query: {
      status?: InvoiceStatus;
      customerId?: string;
      search?: string;
      startDate?: string;
      endDate?: string;
    },
  ) {
    const whereClause: any = { companyId };

    if (query.status) {
      whereClause.status = query.status;
    }

    if (query.customerId) {
      whereClause.customerId = query.customerId;
    }

    if (query.startDate && query.endDate) {
      whereClause.issueDate = {
        gte: new Date(query.startDate),
        lte: new Date(query.endDate),
      };
    }

    if (query.search && query.search.trim()) {
      const q = query.search.trim();
      whereClause.OR = [
        { invoiceNumber: { contains: q } },
        { customer: { name: { contains: q } } },
        { customer: { companyName: { contains: q } } },
        { referenceNumber: { contains: q } },
        { notes: { contains: q } },
      ];
    }

    return this.prisma.invoice.findMany({
      where: whereClause,
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            companyName: true,
            email: true,
            phone: true,
          },
        },
        items: true,
        _count: {
          select: { payments: true },
        },
      },
      orderBy: { issueDate: 'desc' },
    });
  }

  async findOne(companyId: string, id: string) {
    const invoice = await this.prisma.invoice.findFirst({
      where: { id, companyId },
      include: {
        customer: true,
        company: true,
        items: {
          orderBy: { sortOrder: 'asc' },
        },
        payments: {
          orderBy: { paymentDate: 'desc' },
        },
        documents: true,
      },
    });

    if (!invoice) {
      throw new NotFoundException('Invoice not found');
    }

    return invoice;
  }

  async update(companyId: string, id: string, dto: UpdateInvoiceDto) {
    const existing = await this.findOne(companyId, id);

    if (existing.status === InvoiceStatus.PAID) {
      throw new BadRequestException('Cannot edit an invoice that has been fully paid.');
    }

    // Verify customer belongs to company
    const customer = await this.prisma.customer.findFirst({
      where: { id: dto.customerId, companyId },
    });

    if (!customer) {
      throw new BadRequestException('Selected customer does not exist in this company.');
    }

    // Backend calculations
    const totals = calculateInvoiceTotals({
      items: dto.items,
      discountType: dto.discountType || 'PERCENTAGE',
      discountValue: dto.discountValue || 0,
      shippingAmount: dto.shippingAmount || 0,
      paidAmount: Number(existing.paidAmount),
    });

    // Check payment status transition
    let newStatus = dto.status || existing.status;
    if (newStatus !== InvoiceStatus.DRAFT && newStatus !== InvoiceStatus.CANCELLED) {
      if (totals.outstandingBalance <= 0) {
        newStatus = InvoiceStatus.PAID;
      } else if (Number(existing.paidAmount) > 0) {
        newStatus = InvoiceStatus.PARTIALLY_PAID;
      } else {
        newStatus = InvoiceStatus.ISSUED;
      }
    }

    // Update in transaction: delete old items and create new ones
    return this.prisma.$transaction(async (tx) => {
      await tx.invoiceItem.deleteMany({
        where: { invoiceId: id },
      });

      return tx.invoice.update({
        where: { id },
        data: {
          customerId: customer.id,
          referenceNumber: dto.referenceNumber || null,
          issueDate: new Date(dto.issueDate),
          dueDate: new Date(dto.dueDate),
          currency: dto.currency || existing.currency,
          status: newStatus,
          subtotal: totals.subtotal,
          discountType: dto.discountType || 'PERCENTAGE',
          discountValue: dto.discountValue || 0,
          discountAmount: totals.discountAmount + totals.itemDiscountAmount,
          taxAmount: totals.taxAmount,
          shippingAmount: totals.shippingAmount,
          totalAmount: totals.totalAmount,
          outstandingBalance: totals.outstandingBalance,
          notes: dto.notes || null,
          termsAndConditions: dto.termsAndConditions || null,
          paymentInstructions: dto.paymentInstructions || null,
          templateName: dto.templateName || existing.templateName,
          items: {
            create: totals.calculatedItems.map((item, idx) => {
              const rawItem = dto.items[idx];
              return {
                productId: rawItem.productId || null,
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
          items: true,
          company: true,
          payments: true,
        },
      });
    });
  }

  async issueInvoice(companyId: string, id: string) {
    const invoice = await this.findOne(companyId, id);

    if (invoice.status !== InvoiceStatus.DRAFT) {
      return invoice; // already issued or paid
    }

    return this.prisma.invoice.update({
      where: { id },
      data: {
        status: InvoiceStatus.ISSUED,
        publicToken: invoice.publicToken || randomUUID(),
      },
      include: {
        customer: true,
        items: true,
        company: true,
      },
    });
  }

  async cancelInvoice(companyId: string, id: string) {
    const invoice = await this.findOne(companyId, id);

    if (Number(invoice.paidAmount) > 0) {
      throw new BadRequestException('Cannot cancel an invoice with recorded payments. Refund or delete payments first.');
    }

    return this.prisma.invoice.update({
      where: { id },
      data: {
        status: InvoiceStatus.CANCELLED,
      },
    });
  }

  async delete(companyId: string, id: string) {
    const invoice = await this.findOne(companyId, id);

    if (invoice.status !== InvoiceStatus.DRAFT && invoice.status !== InvoiceStatus.CANCELLED) {
      throw new BadRequestException(
        'Only Draft or Cancelled invoices can be deleted to maintain accounting compliance.',
      );
    }

    await this.prisma.invoice.delete({
      where: { id },
    });

    return { message: 'Invoice deleted successfully' };
  }

  async getNextNumber(companyId: string) {
    const number = await generateNextInvoiceNumber(this.prisma, companyId);
    return { nextInvoiceNumber: number };
  }

  // Public invoice access by secure token
  async findByPublicToken(token: string) {
    const invoice = await this.prisma.invoice.findUnique({
      where: { publicToken: token },
      include: {
        customer: {
          select: {
            name: true,
            companyName: true,
            email: true,
            phone: true,
            address1: true,
            address2: true,
            city: true,
            state: true,
            postalCode: true,
            country: true,
            taxId: true,
          },
        },
        company: {
          select: {
            name: true,
            logoUrl: true,
            businessRegNumber: true,
            taxNumber: true,
            email: true,
            phone: true,
            website: true,
            address1: true,
            address2: true,
            city: true,
            state: true,
            postalCode: true,
            country: true,
            defaultCurrency: true,
            brandColor: true,
            bankDetails: true,
            defaultInvoiceFooter: true,
          },
        },
        items: {
          orderBy: { sortOrder: 'asc' },
        },
        payments: {
          where: { status: 'COMPLETED' },
          select: {
            amount: true,
            currency: true,
            paymentDate: true,
            paymentMethod: true,
            transactionReference: true,
          },
        },
      },
    });

    if (!invoice) {
      throw new NotFoundException('Public invoice not found or link has expired.');
    }

    return invoice;
  }
}

