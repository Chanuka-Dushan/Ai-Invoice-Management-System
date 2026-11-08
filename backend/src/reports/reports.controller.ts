import { Controller, Get, Query, Res, UseGuards } from '@nestjs/common';
import { Response } from 'express';
import { ReportsService } from './reports.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CompanyAccessGuard } from '../common/guards/company-access.guard';
import { CurrentCompanyId } from '../common/decorators/current-company.decorator';

@UseGuards(JwtAuthGuard, CompanyAccessGuard)
@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('dashboard')
  async getDashboard(
    @CurrentCompanyId() companyId: string,
    @Query('range') range?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.reportsService.getDashboardSummary(companyId, range, startDate, endDate);
  }

  @Get('export/invoices')
  async exportInvoices(@CurrentCompanyId() companyId: string, @Res() res: Response) {
    const csv = await this.reportsService.exportInvoicesCsv(companyId);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="invoices-export.csv"');
    res.send(csv);
  }

  @Get('export/expenses')
  async exportExpenses(@CurrentCompanyId() companyId: string, @Res() res: Response) {
    const csv = await this.reportsService.exportExpensesCsv(companyId);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="expenses-export.csv"');
    res.send(csv);
  }
}

