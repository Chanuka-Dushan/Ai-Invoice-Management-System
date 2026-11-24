import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  Req,
  Res,
  UseGuards,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import { ExternalApiService } from './external-api.service';
import { ApiKeyGuard } from './guards/api-key.guard';
import {
  CreateExternalInvoiceDto,
  ExternalCustomerDto,
  RecordExternalPaymentDto,
} from './dto/external-invoice.dto';

@Controller('api/v1')
@UseGuards(ApiKeyGuard)
export class ExternalApiController {
  constructor(private readonly externalApiService: ExternalApiService) {}

  @Get('ping')
  async ping(@Req() req: any) {
    return this.externalApiService.ping(req.company);
  }

  @Post('invoices')
  async createInvoice(
    @Req() req: any,
    @Body() dto: CreateExternalInvoiceDto,
  ) {
    return this.externalApiService.createInvoice(req.companyId, dto);
  }

  @Get('invoices')
  async listInvoices(
    @Req() req: any,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: string,
    @Query('search') search?: string,
  ) {
    return this.externalApiService.listInvoices(req.companyId, {
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
      status,
      search,
    });
  }

  @Get('invoices/:id')
  async getInvoice(@Req() req: any, @Param('id') id: string) {
    return this.externalApiService.getInvoice(req.companyId, id);
  }

  @Get('invoices/:id/pdf')
  async downloadInvoicePdf(
    @Req() req: any,
    @Param('id') id: string,
    @Res() res: Response,
  ) {
    const { buffer, invoiceNumber } =
      await this.externalApiService.getInvoicePdfBuffer(req.companyId, id);

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="invoice-${invoiceNumber}.pdf"`,
      'Content-Length': buffer.length,
    });

    res.status(HttpStatus.OK).end(buffer);
  }

  @Post('invoices/:id/send')
  async sendInvoiceEmail(
    @Req() req: any,
    @Param('id') id: string,
    @Body('recipient') recipient?: string,
  ) {
    return this.externalApiService.sendInvoiceEmail(
      req.companyId,
      id,
      recipient,
    );
  }

  @Post('invoices/:id/payments')
  async recordPayment(
    @Req() req: any,
    @Param('id') id: string,
    @Body() dto: RecordExternalPaymentDto,
  ) {
    return this.externalApiService.recordPayment(req.companyId, id, dto);
  }

  @Get('customers')
  async listCustomers(
    @Req() req: any,
    @Query('search') search?: string,
    @Query('limit') limit?: string,
  ) {
    return this.externalApiService.listCustomers(
      req.companyId,
      search,
      limit ? parseInt(limit, 10) : undefined,
    );
  }

  @Post('customers')
  async createOrUpdateCustomer(
    @Req() req: any,
    @Body() dto: ExternalCustomerDto,
  ) {
    return this.externalApiService.createOrUpdateCustomer(
      req.companyId,
      dto,
    );
  }
}
