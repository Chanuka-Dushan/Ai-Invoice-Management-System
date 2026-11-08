import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSupplierDto, UpdateSupplierDto } from './dto/supplier.dto';

@Injectable()
export class SuppliersService {
  constructor(private prisma: PrismaService) {}

  async create(companyId: string, dto: CreateSupplierDto) {
    return this.prisma.supplier.create({
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
        { contactPerson: { contains: q } },
        { email: { contains: q } },
        { phone: { contains: q } },
      ];
    }

    const suppliers = await this.prisma.supplier.findMany({
      where: whereClause,
      include: {
        incomingInvoices: {
          select: {
            id: true,
            totalAmount: true,
            status: true,
            payments: {
              select: { amount: true },
            },
          },
        },
      },
      orderBy: { name: 'asc' },
    });

    return suppliers.map((s) => {
      const totalExpenses = s.incomingInvoices
        .filter((inv) => inv.status === 'APPROVED')
        .reduce((sum, inv) => sum + Number(inv.totalAmount), 0);

      const totalPaid = s.incomingInvoices.reduce(
        (sum, inv) =>
          sum +
          inv.payments.reduce((pSum, p) => pSum + Number(p.amount), 0),
        0,
      );

      const outstanding = Math.max(0, totalExpenses - totalPaid);

      return {
        ...s,
        invoiceCount: s.incomingInvoices.length,
        totalExpenses: Math.round(totalExpenses * 100) / 100,
        totalPaid: Math.round(totalPaid * 100) / 100,
        outstanding: Math.round(outstanding * 100) / 100,
        incomingInvoices: undefined,
      };
    });
  }

  async findOne(companyId: string, id: string) {
    const supplier = await this.prisma.supplier.findFirst({
      where: { id, companyId },
      include: {
        incomingInvoices: {
          orderBy: { createdAt: 'desc' },
          include: {
            items: true,
            payments: true,
          },
        },
      },
    });

    if (!supplier) {
      throw new NotFoundException('Supplier not found');
    }

    const totalExpenses = supplier.incomingInvoices
      .filter((inv) => inv.status === 'APPROVED')
      .reduce((sum, inv) => sum + Number(inv.totalAmount), 0);

    const totalPaid = supplier.incomingInvoices.reduce(
      (sum, inv) =>
        sum +
        inv.payments.reduce((pSum, p) => pSum + Number(p.amount), 0),
      0,
    );

    return {
      ...supplier,
      totalExpenses: Math.round(totalExpenses * 100) / 100,
      totalPaid: Math.round(totalPaid * 100) / 100,
      outstanding: Math.round(Math.max(0, totalExpenses - totalPaid) * 100) / 100,
    };
  }

  async update(companyId: string, id: string, dto: UpdateSupplierDto) {
    await this.findOne(companyId, id);

    return this.prisma.supplier.update({
      where: { id },
      data: dto,
    });
  }

  async delete(companyId: string, id: string) {
    await this.findOne(companyId, id);

    const invoiceCount = await this.prisma.incomingInvoice.count({
      where: { supplierId: id },
    });

    if (invoiceCount > 0) {
      await this.prisma.supplier.update({
        where: { id },
        data: { isArchived: true },
      });
      return { message: 'Supplier has associated incoming invoices and was archived.' };
    }

    await this.prisma.supplier.delete({
      where: { id },
    });

    return { message: 'Supplier deleted successfully' };
  }
}

