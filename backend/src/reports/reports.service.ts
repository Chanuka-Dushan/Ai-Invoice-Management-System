import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { toFixed2 } from '../common/utils/decimal.util';
import {
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
  subMonths,
  format,
} from 'date-fns';

@Injectable()
export class ReportsService {
  constructor(private prisma: PrismaService) {}

  async getDashboardSummary(companyId: string, filterRange = 'this_month', customStart?: string, customEnd?: string) {
    const now = new Date();
    let startDate: Date;
    let endDate: Date;

    switch (filterRange) {
      case 'today':
        startDate = startOfDay(now);
        endDate = endOfDay(now);
        break;
      case 'this_week':
        startDate = startOfWeek(now, { weekStartsOn: 1 });
        endDate = endOfWeek(now, { weekStartsOn: 1 });
        break;
      case 'this_year':
        startDate = startOfYear(now);
        endDate = endOfYear(now);
        break;
      case 'custom':
        startDate = customStart ? new Date(customStart) : startOfMonth(now);
        endDate = customEnd ? new Date(customEnd) : endOfMonth(now);
        break;
      case 'this_month':
      default:
        startDate = startOfMonth(now);
        endDate = endOfMonth(now);
        break;
    }

    const [
      allPeriodInvoices,
      allPeriodPayments,
      allPeriodExpenses,
      recentInvoices,
      recentPayments,
      allActiveInvoices,
    ] = await Promise.all([
      this.prisma.invoice.findMany({
        where: {
          companyId,
          issueDate: { gte: startDate, lte: endDate },
        },
      }),
      this.prisma.payment.findMany({
        where: {
          companyId,
          status: 'COMPLETED',
          paymentDate: { gte: startDate, lte: endDate },
        },
      }),
      this.prisma.incomingInvoice.findMany({
        where: {
          companyId,
          status: 'APPROVED',
          createdAt: { gte: startDate, lte: endDate },
        },
      }),
      this.prisma.invoice.findMany({
        where: { companyId },
        take: 5,
        orderBy: { issueDate: 'desc' },
        include: { customer: { select: { name: true, companyName: true } } },
      }),
      this.prisma.payment.findMany({
        where: { companyId },
        take: 5,
        orderBy: { paymentDate: 'desc' },
        include: {
          invoice: {
            select: { invoiceNumber: true, customer: { select: { name: true } } },
          },
        },
      }),
      this.prisma.invoice.findMany({
        where: {
          companyId,
          status: { notIn: ['CANCELLED', 'DRAFT'] },
        },
      }),
    ]);

    const totalRevenue = allPeriodPayments.reduce((s, p) => s + Number(p.amount), 0);
    const totalExpenses = allPeriodExpenses.reduce((s, e) => s + Number(e.totalAmount), 0);
    const totalInvoices = allPeriodInvoices.length;

    const paidInvoicesCount = allPeriodInvoices.filter((i) => i.status === 'PAID').length;
    const unpaidInvoicesCount = allPeriodInvoices.filter((i) =>
      ['ISSUED', 'PARTIALLY_PAID'].includes(i.status),
    ).length;
    const overdueInvoicesCount = allPeriodInvoices.filter((i) => {
      return (
        i.status === 'OVERDUE' ||
        (new Date(i.dueDate) < new Date() && Number(i.outstandingBalance) > 0)
      );
    }).length;

    const outstandingBalance = allActiveInvoices.reduce((s, i) => s + Number(i.outstandingBalance), 0);

    // Build 6-month revenue vs expense chart series
    const monthlyChart: Array<{ month: string; revenue: number; expense: number }> = [];
    for (let i = 5; i >= 0; i--) {
      const monthDate = subMonths(now, i);
      const mStart = startOfMonth(monthDate);
      const mEnd = endOfMonth(monthDate);
      const mLabel = format(monthDate, 'MMM yyyy');

      const [mPayments, mBills] = await Promise.all([
        this.prisma.payment.findMany({
          where: {
            companyId,
            status: 'COMPLETED',
            paymentDate: { gte: mStart, lte: mEnd },
          },
        }),
        this.prisma.incomingInvoice.findMany({
          where: {
            companyId,
            status: 'APPROVED',
            createdAt: { gte: mStart, lte: mEnd },
          },
        }),
      ]);

      const rev = mPayments.reduce((s, p) => s + Number(p.amount), 0);
      const exp = mBills.reduce((s, b) => s + Number(b.totalAmount), 0);

      monthlyChart.push({
        month: mLabel,
        revenue: toFixed2(rev),
        expense: toFixed2(exp),
      });
    }

    return {
      kpis: {
        totalRevenue: toFixed2(totalRevenue),
        totalExpenses: toFixed2(totalExpenses),
        netProfit: toFixed2(totalRevenue - totalExpenses),
        totalInvoices,
        paidInvoicesCount,
        unpaidInvoicesCount,
        overdueInvoicesCount,
        outstandingBalance: toFixed2(outstandingBalance),
      },
      recentInvoices,
      recentPayments,
      monthlyChart,
    };
  }

  async exportInvoicesCsv(companyId: string): Promise<string> {
    const invoices = await this.prisma.invoice.findMany({
      where: { companyId },
      include: { customer: true },
      orderBy: { issueDate: 'desc' },
    });

    const header = ['Invoice Number', 'Customer', 'Issue Date', 'Due Date', 'Currency', 'Status', 'Total', 'Paid', 'Balance'];
    const rows = invoices.map((i) => [
      i.invoiceNumber,
      `"${(i.customer.name || '').replace(/"/g, '""')}"`,
      format(new Date(i.issueDate), 'yyyy-MM-dd'),
      format(new Date(i.dueDate), 'yyyy-MM-dd'),
      i.currency,
      i.status,
      Number(i.totalAmount).toFixed(2),
      Number(i.paidAmount).toFixed(2),
      Number(i.outstandingBalance).toFixed(2),
    ]);

    return [header.join(','), ...rows.map((r) => r.join(','))].join('\n');
  }

  async exportExpensesCsv(companyId: string): Promise<string> {
    const bills = await this.prisma.incomingInvoice.findMany({
      where: { companyId },
      include: { supplier: true },
      orderBy: { createdAt: 'desc' },
    });

    const header = ['Invoice Number', 'Supplier', 'Date', 'Status', 'Currency', 'Subtotal', 'Tax', 'Total Amount'];
    const rows = bills.map((b) => [
      b.invoiceNumber || 'N/A',
      `"${(b.supplier?.name || 'Unassigned').replace(/"/g, '""')}"`,
      b.invoiceDate ? format(new Date(b.invoiceDate), 'yyyy-MM-dd') : 'N/A',
      b.status,
      b.currency,
      Number(b.subtotal).toFixed(2),
      Number(b.taxAmount).toFixed(2),
      Number(b.totalAmount).toFixed(2),
    ]);

    return [header.join(','), ...rows.map((r) => r.join(','))].join('\n');
  }
}

