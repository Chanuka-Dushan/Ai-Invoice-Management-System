import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { InvoicesService } from './invoices.service';
import { CreateInvoiceDto, UpdateInvoiceDto } from './dto/invoice.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CompanyAccessGuard } from '../common/guards/company-access.guard';
import { CurrentCompanyId } from '../common/decorators/current-company.decorator';
import { InvoiceStatus } from '@prisma/client';

@Controller('invoices')
export class InvoicesController {
  constructor(private readonly invoicesService: InvoicesService) {}

  // Public endpoint for viewing shared invoice by secure token
  @Get('public/:token')
  async getPublicInvoice(@Param('token') token: string) {
    return this.invoicesService.findByPublicToken(token);
  }

  @UseGuards(JwtAuthGuard, CompanyAccessGuard)
  @Post()
  async create(
    @CurrentCompanyId() companyId: string,
    @Body() dto: CreateInvoiceDto,
  ) {
    return this.invoicesService.create(companyId, dto);
  }

  @UseGuards(JwtAuthGuard, CompanyAccessGuard)
  @Get()
  async findAll(
    @CurrentCompanyId() companyId: string,
    @Query('status') status?: InvoiceStatus,
    @Query('customerId') customerId?: string,
    @Query('search') search?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.invoicesService.findAll(companyId, {
      status,
      customerId,
      search,
      startDate,
      endDate,
    });
  }

  @UseGuards(JwtAuthGuard, CompanyAccessGuard)
  @Get('next-number')
  async getNextNumber(@CurrentCompanyId() companyId: string) {
    return this.invoicesService.getNextNumber(companyId);
  }

  @UseGuards(JwtAuthGuard, CompanyAccessGuard)
  @Get(':id')
  async findOne(
    @CurrentCompanyId() companyId: string,
    @Param('id') id: string,
  ) {
    return this.invoicesService.findOne(companyId, id);
  }

  @UseGuards(JwtAuthGuard, CompanyAccessGuard)
  @Put(':id')
  async update(
    @CurrentCompanyId() companyId: string,
    @Param('id') id: string,
    @Body() dto: UpdateInvoiceDto,
  ) {
    return this.invoicesService.update(companyId, id, dto);
  }

  @UseGuards(JwtAuthGuard, CompanyAccessGuard)
  @Post(':id/issue')
  async issue(
    @CurrentCompanyId() companyId: string,
    @Param('id') id: string,
  ) {
    return this.invoicesService.issueInvoice(companyId, id);
  }

  @UseGuards(JwtAuthGuard, CompanyAccessGuard)
  @Post(':id/cancel')
  async cancel(
    @CurrentCompanyId() companyId: string,
    @Param('id') id: string,
  ) {
    return this.invoicesService.cancelInvoice(companyId, id);
  }

  @UseGuards(JwtAuthGuard, CompanyAccessGuard)
  @Delete(':id')
  async delete(
    @CurrentCompanyId() companyId: string,
    @Param('id') id: string,
  ) {
    return this.invoicesService.delete(companyId, id);
  }
}

