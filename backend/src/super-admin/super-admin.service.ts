import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SuperAdminService {
  constructor(private readonly prisma: PrismaService) {}

  async getPlatformStats() {
    const [
      totalCompanies,
      totalUsers,
      totalInvoices,
      totalCustomers,
      invoices,
      recentCompanies,
      recentUsers,
    ] = await Promise.all([
      this.prisma.company.count(),
      this.prisma.user.count(),
      this.prisma.invoice.count(),
      this.prisma.customer.count(),
      this.prisma.invoice.findMany({
        select: {
          status: true,
          totalAmount: true,
          paidAmount: true,
          currency: true,
        },
      }),
      this.prisma.company.findMany({
        orderBy: { createdAt: 'desc' },
        take: 5,
        include: {
          _count: { select: { members: true, invoices: true } },
        },
      }),
      this.prisma.user.findMany({
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          isSuperAdmin: true,
          isActive: true,
          createdAt: true,
        },
      }),
    ]);

    const totalVolume = invoices.reduce((s, i) => s + Number(i.totalAmount || 0), 0);
    const totalCollected = invoices.reduce((s, i) => s + Number(i.paidAmount || 0), 0);

    const statusCounts: Record<string, number> = {};
    invoices.forEach((i) => {
      statusCounts[i.status] = (statusCounts[i.status] || 0) + 1;
    });

    return {
      totalCompanies,
      totalUsers,
      totalInvoices,
      totalCustomers,
      totalVolume: Math.round(totalVolume * 100) / 100,
      totalCollected: Math.round(totalCollected * 100) / 100,
      statusCounts,
      recentCompanies: recentCompanies.map((c) => ({
        id: c.id,
        name: c.name,
        email: c.email,
        membersCount: c._count.members,
        invoicesCount: c._count.invoices,
        isActive: c.isActive,
        createdAt: c.createdAt,
      })),
      recentUsers,
    };
  }

  async getAllCompanies() {
    const companies = await this.prisma.company.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { members: true, invoices: true, customers: true },
        },
        members: {
          where: { role: 'OWNER' },
          include: {
            user: {
              select: { id: true, firstName: true, lastName: true, email: true },
            },
          },
          take: 1,
        },
      },
    });

    return companies.map((c) => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
      email: c.email,
      phone: c.phone,
      country: c.country,
      defaultCurrency: c.defaultCurrency,
      brandColor: c.brandColor,
      isActive: c.isActive,
      createdAt: c.createdAt,
      owner: c.members[0]?.user || null,
      stats: {
        membersCount: c._count.members,
        invoicesCount: c._count.invoices,
        customersCount: c._count.customers,
      },
    }));
  }

  async getCompanyDetails(companyId: string) {
    const company = await this.prisma.company.findUnique({
      where: { id: companyId },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                isSuperAdmin: true,
                isActive: true,
              },
            },
          },
        },
        invoices: {
          orderBy: { issueDate: 'desc' },
          take: 10,
          include: { customer: { select: { name: true } } },
        },
        _count: {
          select: {
            members: true,
            invoices: true,
            customers: true,
            suppliers: true,
            products: true,
          },
        },
      },
    });

    if (!company) throw new NotFoundException('Company not found');
    return company;
  }

  async toggleCompanyStatus(companyId: string, isActive: boolean) {
    const company = await this.prisma.company.findUnique({ where: { id: companyId } });
    if (!company) throw new NotFoundException('Company not found');

    return this.prisma.company.update({
      where: { id: companyId },
      data: { isActive },
    });
  }

  async getAllUsers() {
    const users = await this.prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        isSuperAdmin: true,
        isActive: true,
        createdAt: true,
        companyMembers: {
          include: {
            company: {
              select: { id: true, name: true },
            },
          },
        },
      },
    });

    return users.map((u) => ({
      id: u.id,
      email: u.email,
      name: `${u.firstName} ${u.lastName}`.trim(),
      phone: u.phone,
      isSuperAdmin: u.isSuperAdmin,
      isActive: u.isActive,
      createdAt: u.createdAt,
      companies: u.companyMembers.map((cm) => ({
        companyId: cm.company.id,
        companyName: cm.company.name,
        role: cm.role,
      })),
    }));
  }

  async toggleUserStatus(userId: string, isActive: boolean) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    return this.prisma.user.update({
      where: { id: userId },
      data: { isActive },
      select: { id: true, email: true, isActive: true },
    });
  }

  async toggleSuperAdminRole(userId: string, isSuperAdmin: boolean) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    return this.prisma.user.update({
      where: { id: userId },
      data: { isSuperAdmin },
      select: { id: true, email: true, isSuperAdmin: true },
    });
  }

  async getPlatformAuditLogs() {
    return this.prisma.auditLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 100,
      include: {
        company: { select: { name: true } },
        user: { select: { email: true, firstName: true, lastName: true } },
      },
    });
  }
}

