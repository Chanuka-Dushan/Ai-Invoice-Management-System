import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCustomerDto, UpdateCustomerDto } from './dto/customer.dto';

@Injectable()
export class CustomersService {
  constructor(private prisma: PrismaService) {}

  async create(companyId: string, dto: CreateCustomerDto) {
    return this.prisma.customer.create({
      data: {
        ...dto,
        companyId,
      },
    });
  }

  async findAll(companyId: string, search?: string) {
    const whereClause: any = {
      companyId,
      isArchived: false,
    };

    if (search && search.trim()) {
      const q = search.trim();
      whereClause.OR = [
        { name: { contains: q } },
        { companyName: { contains: q } },
        { email: { contains: q } },
        { phone: { contains: q } },
      ];
    }

    const customers = await this.prisma.customer.findMany({
      where: whereClause,
      include: {
        invoices: {
          select: {
            id: true,
            totalAmount: true,
            paidAmount: true,
            outstandingBalance: true,
            status: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    });

    return customers.map((c) => {
      const totalInvoiced = c.invoices.reduce((sum, inv) => sum + Number(inv.totalAmount), 0);
      const totalPaid = c.invoices.reduce((sum, inv) => sum + Number(inv.paidAmount), 0);
      const outstandingBalance = c.invoices
        .filter((inv) => inv.status !== 'CANCELLED' && inv.status !== 'DRAFT')
        .reduce((sum, inv) => sum + Number(inv.outstandingBalance), 0);

      return {
        ...c,
        invoiceCount: c.invoices.length,
        totalInvoiced: Math.round(totalInvoiced * 100) / 100,
        totalPaid: Math.round(totalPaid * 100) / 100,
        outstandingBalance: Math.round(outstandingBalance * 100) / 100,
        invoices: undefined, // keep payload clean
      };
    });
  }

  async findOne(companyId: string, id: string) {
    const customer = await this.prisma.customer.findFirst({
      where: { id, companyId },
      include: {
        invoices: {
          orderBy: { createdAt: 'desc' },
          include: {
            payments: {
              orderBy: { paymentDate: 'desc' },
            },
          },
        },
      },
    });

    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    const totalInvoiced = customer.invoices.reduce((sum, inv) => sum + Number(inv.totalAmount), 0);
    const totalPaid = customer.invoices.reduce((sum, inv) => sum + Number(inv.paidAmount), 0);
    const outstandingBalance = customer.invoices
      .filter((inv) => inv.status !== 'CANCELLED' && inv.status !== 'DRAFT')
      .reduce((sum, inv) => sum + Number(inv.outstandingBalance), 0);

    return {
      ...customer,
      totalInvoiced: Math.round(totalInvoiced * 100) / 100,
      totalPaid: Math.round(totalPaid * 100) / 100,
      outstandingBalance: Math.round(outstandingBalance * 100) / 100,
    };
  }

  async update(companyId: string, id: string, dto: UpdateCustomerDto) {
    await this.findOne(companyId, id);

    return this.prisma.customer.update({
      where: { id },
      data: dto,
    });
  }

  async delete(companyId: string, id: string) {
    const customer = await this.findOne(companyId, id);

    const invoiceCount = await this.prisma.invoice.count({
      where: { customerId: id },
    });

    if (invoiceCount > 0) {
      // Safe archival to prevent breaking historical records
      await this.prisma.customer.update({
        where: { id },
        data: { isArchived: true },
      });
      return { message: 'Customer has associated invoices and was archived instead of permanently deleted.' };
    }

    await this.prisma.customer.delete({
      where: { id },
    });

    return { message: 'Customer deleted successfully' };
  }
}

