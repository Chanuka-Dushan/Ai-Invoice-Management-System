import { Controller, Get, Param, Res, NotFoundException } from '@nestjs/common';
import { Response } from 'express';
import { PdfService } from './pdf.service';

@Controller('pdf')
export class PdfController {
  constructor(private readonly pdfService: PdfService) {}

  @Get('invoices/public/:token')
  async downloadPublicPdf(@Param('token') token: string, @Res() res: Response) {
    const pdfBuffer = await this.pdfService.generatePublicInvoicePdf(token);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="invoice-${token.slice(0, 8)}.pdf"`);
    res.send(pdfBuffer);
  }

  @Get('invoices/:id')
  async downloadInvoicePdf(
    @Param('id') invoiceId: string,
    @Res() res: Response,
  ) {
    const pdfBuffer = await this.pdfService.generateInvoicePdf(invoiceId);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="invoice-${invoiceId.slice(0, 8)}.pdf"`);
    res.send(pdfBuffer);
  }
}
