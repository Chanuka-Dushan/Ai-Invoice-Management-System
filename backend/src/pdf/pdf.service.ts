import { Injectable, NotFoundException } from '@nestjs/common';
import * as PDFDocument from 'pdfkit';
import { PrismaService } from '../prisma/prisma.service';
import * as path from 'path';
import * as fs from 'fs';
import { format } from 'date-fns';

@Injectable()
export class PdfService {
  constructor(private prisma: PrismaService) {}

  async generateInvoicePdf(invoiceId: string, companyId?: string): Promise<Buffer> {
    const whereClause: any = { id: invoiceId };
    if (companyId) {
      whereClause.companyId = companyId;
    }

    const invoice = await this.prisma.invoice.findFirst({
      where: whereClause,
      include: {
        customer: true,
        company: true,
        items: {
          orderBy: { sortOrder: 'asc' },
        },
        payments: {
          where: { status: 'COMPLETED' },
        },
      },
    });

    if (!invoice) {
      throw new NotFoundException('Invoice not found');
    }

    return this.renderPdf(invoice);
  }

  async generatePublicInvoicePdf(token: string): Promise<Buffer> {
    const invoice = await this.prisma.invoice.findUnique({
      where: { publicToken: token },
      include: {
        customer: true,
        company: true,
        items: {
          orderBy: { sortOrder: 'asc' },
        },
        payments: {
          where: { status: 'COMPLETED' },
        },
      },
    });

    if (!invoice) {
      throw new NotFoundException('Public invoice not found');
    }

    return this.renderPdf(invoice);
  }

  private renderPdf(invoice: any): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 40, size: 'A4' });
      const buffers: Buffer[] = [];

      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => {
        const pdfData = Buffer.concat(buffers);
        resolve(pdfData);
      });
      doc.on('error', reject);

      const template = invoice.templateName || 'MODERN';
      const brandColor = invoice.company?.brandColor || '#1e3a8a';

      switch (template) {
        case 'MINIMAL':
          this.buildMinimalTemplate(doc, invoice, brandColor);
          break;
        case 'CORPORATE':
          this.buildCorporateTemplate(doc, invoice, brandColor);
          break;
        case 'CREATIVE':
          this.buildCreativeTemplate(doc, invoice, brandColor);
          break;
        case 'MODERN':
        default:
          this.buildModernTemplate(doc, invoice, brandColor);
          break;
      }

      doc.end();
    });
  }

  private buildModernTemplate(doc: PDFKit.PDFDocument, inv: any, brandColor: string) {
    // Header accent bar at the very top of the A4 page
    doc.rect(0, 0, 595.28, 10).fill(brandColor);

    let leftY = 30;
    let rightY = 30;

    // LEFT COLUMN: Company Logo and details
    if (inv.company.logoUrl) {
      const fullLogoPath = path.join(process.cwd(), inv.company.logoUrl);
      if (fs.existsSync(fullLogoPath)) {
        try {
          doc.image(fullLogoPath, 40, leftY, { width: 110, height: 48, fit: [110, 48] });
          leftY += 56;
        } catch {
          doc.fillColor(brandColor).fontSize(18).font('Helvetica-Bold').text(inv.company.name, 40, leftY, { width: 240 });
          leftY += 24;
        }
      } else {
        doc.fillColor(brandColor).fontSize(18).font('Helvetica-Bold').text(inv.company.name, 40, leftY, { width: 240 });
        leftY += 24;
      }
    } else {
      doc.fillColor(brandColor).fontSize(18).font('Helvetica-Bold').text(inv.company.name, 40, leftY, { width: 240 });
      leftY += 24;
    }

    // Company contact details under the logo (Every line has explicit X and Y coordinates)
    doc.fillColor('#4b5563').fontSize(8.5).font('Helvetica');
    if (inv.company.address1) {
      doc.text(inv.company.address1, 40, leftY, { width: 240 });
      leftY += 12;
    }
    const cityState = [inv.company.city, inv.company.state, inv.company.postalCode].filter(Boolean).join(', ');
    if (cityState) {
      doc.text(cityState, 40, leftY, { width: 240 });
      leftY += 12;
    }
    if (inv.company.country) {
      doc.text(inv.company.country, 40, leftY, { width: 240 });
      leftY += 12;
    }
    if (inv.company.email) {
      doc.text(inv.company.email, 40, leftY, { width: 240 });
      leftY += 12;
    }
    if (inv.company.phone) {
      doc.text(inv.company.phone, 40, leftY, { width: 240 });
      leftY += 12;
    }
    if (inv.company.taxNumber) {
      doc.text(`Tax ID: ${inv.company.taxNumber}`, 40, leftY, { width: 240 });
      leftY += 12;
    }

    // RIGHT COLUMN: INVOICE title & Meta
    doc.fillColor(brandColor).fontSize(26).font('Helvetica-Bold').text('INVOICE', 320, rightY, { width: 235, align: 'right' });
    rightY += 32;
    doc.fillColor('#111827').fontSize(11).font('Helvetica-Bold').text(inv.invoiceNumber, 320, rightY, { width: 235, align: 'right' });
    rightY += 18;

    // Status Badge
    doc.rect(480, rightY, 75, 17).fill(this.getStatusBadgeColor(inv.status));
    doc.fillColor('#ffffff').fontSize(8).font('Helvetica-Bold').text(inv.status, 480, rightY + 4, { width: 75, align: 'center' });
    rightY += 23;

    doc.fillColor('#4b5563').fontSize(8.5).font('Helvetica');
    doc.text(`Issue Date: ${format(new Date(inv.issueDate), 'MMM dd, yyyy')}`, 320, rightY, { width: 235, align: 'right' });
    rightY += 13;
    doc.text(`Due Date: ${format(new Date(inv.dueDate), 'MMM dd, yyyy')}`, 320, rightY, { width: 235, align: 'right' });
    rightY += 13;
    if (inv.referenceNumber) {
      doc.text(`Reference: ${inv.referenceNumber}`, 320, rightY, { width: 235, align: 'right' });
      rightY += 13;
    }

    // Divider Line (Guaranteed strictly below BOTH columns)
    let y = Math.max(leftY, rightY) + 16;
    doc.moveTo(40, y).lineTo(555, y).strokeColor('#e5e7eb').lineWidth(1).stroke();
    y += 16;

    // Bill To
    doc.fillColor(brandColor).fontSize(9.5).font('Helvetica-Bold').text('BILL TO:', 40, y);
    y += 14;
    doc.fillColor('#111827').fontSize(10.5).font('Helvetica-Bold').text(inv.customer.name, 40, y, { width: 300 });
    y += 14;
    doc.fillColor('#4b5563').fontSize(8.5).font('Helvetica');
    if (inv.customer.companyName) {
      doc.text(inv.customer.companyName, 40, y, { width: 300 });
      y += 12;
    }
    if (inv.customer.email) {
      doc.text(inv.customer.email, 40, y, { width: 300 });
      y += 12;
    }
    if (inv.customer.phone) {
      doc.text(inv.customer.phone, 40, y, { width: 300 });
      y += 12;
    }
    if (inv.customer.address1) {
      doc.text(inv.customer.address1, 40, y, { width: 300 });
      y += 12;
    }
    const custCity = [inv.customer.city, inv.customer.country].filter(Boolean).join(', ');
    if (custCity) {
      doc.text(custCity, 40, y, { width: 300 });
      y += 12;
    }

    y += 16;

    // Items Table Header
    doc.rect(40, y, 515, 24).fill('#f8fafc');
    doc.fillColor('#334155').fontSize(8.5).font('Helvetica-Bold');
    doc.text('#', 48, y + 7, { width: 20 });
    doc.text('Item & Description', 75, y + 7, { width: 230 });
    doc.text('Qty', 310, y + 7, { width: 40, align: 'right' });
    doc.text('Unit Price', 360, y + 7, { width: 65, align: 'right' });
    doc.text('Tax', 430, y + 7, { width: 45, align: 'right' });
    doc.text('Total', 485, y + 7, { width: 65, align: 'right' });

    y += 28;

    // Table Items Rows
    inv.items.forEach((item: any, idx: number) => {
      if (y > 690) {
        doc.addPage();
        y = 40;
      }

      const itemTotal = Number(item.lineTotal).toFixed(2);
      const unitPrice = Number(item.unitPrice).toFixed(2);

      doc.fillColor('#64748b').font('Helvetica').fontSize(8.5).text(String(idx + 1), 48, y, { width: 20 });
      doc.fillColor('#0f172a').font('Helvetica-Bold').fontSize(8.5).text(item.name, 75, y, { width: 230 });

      let descHeight = 0;
      if (item.description) {
        doc.fillColor('#64748b').font('Helvetica').fontSize(7.5);
        doc.text(item.description, 75, y + 12, { width: 230 });
        descHeight = 12;
      }

      doc.font('Helvetica').fontSize(8.5).fillColor('#0f172a');
      doc.text(String(item.quantity), 310, y, { width: 40, align: 'right' });
      doc.text(`${inv.currency} ${unitPrice}`, 360, y, { width: 65, align: 'right' });
      doc.text(`${item.taxRate > 0 ? item.taxRate + '%' : '-'}`, 430, y, { width: 45, align: 'right' });
      doc.font('Helvetica-Bold').text(`${inv.currency} ${itemTotal}`, 485, y, { width: 65, align: 'right' });

      y += Math.max(22, 14 + descHeight);
      doc.moveTo(40, y).lineTo(555, y).strokeColor('#f1f5f9').lineWidth(0.5).stroke();
      y += 6;
    });

    y += 12;

    // Ensure sufficient space on page for totals and bank instructions
    if (y > 640) {
      doc.addPage();
      y = 40;
    }

    // Bottom section: Financial Totals on Right, Notes/Payment Info on Left
    const totalsX = 350;
    const totalsValX = 455;
    const totalsW = 100;
    let totalsY = y;

    doc.fontSize(8.5).font('Helvetica').fillColor('#475569');
    doc.text('Subtotal:', totalsX, totalsY);
    doc.text(`${inv.currency} ${Number(inv.subtotal).toFixed(2)}`, totalsValX, totalsY, { width: totalsW, align: 'right' });
    totalsY += 15;

    if (Number(inv.discountAmount) > 0) {
      doc.text('Discount:', totalsX, totalsY);
      doc.text(`-${inv.currency} ${Number(inv.discountAmount).toFixed(2)}`, totalsValX, totalsY, { width: totalsW, align: 'right' });
      totalsY += 15;
    }

    if (Number(inv.taxAmount) > 0) {
      doc.text('Tax / VAT:', totalsX, totalsY);
      doc.text(`${inv.currency} ${Number(inv.taxAmount).toFixed(2)}`, totalsValX, totalsY, { width: totalsW, align: 'right' });
      totalsY += 15;
    }

    if (Number(inv.shippingAmount) > 0) {
      doc.text('Shipping / Other:', totalsX, totalsY);
      doc.text(`${inv.currency} ${Number(inv.shippingAmount).toFixed(2)}`, totalsValX, totalsY, { width: totalsW, align: 'right' });
      totalsY += 15;
    }

    // Grand Total box
    doc.rect(totalsX - 10, totalsY, 215, 26).fill(brandColor);
    doc.fillColor('#ffffff').fontSize(10.5).font('Helvetica-Bold').text('Total Amount:', totalsX, totalsY + 7);
    doc.text(`${inv.currency} ${Number(inv.totalAmount).toFixed(2)}`, totalsValX, totalsY + 7, { width: totalsW, align: 'right' });
    totalsY += 34;

    if (Number(inv.paidAmount) > 0) {
      doc.fillColor('#059669').fontSize(8.5).font('Helvetica-Bold').text('Amount Paid:', totalsX, totalsY);
      doc.text(`${inv.currency} ${Number(inv.paidAmount).toFixed(2)}`, totalsValX, totalsY, { width: totalsW, align: 'right' });
      totalsY += 15;

      doc.fillColor('#dc2626').fontSize(9.5).font('Helvetica-Bold').text('Balance Due:', totalsX, totalsY);
      doc.text(`${inv.currency} ${Number(inv.outstandingBalance).toFixed(2)}`, totalsValX, totalsY, { width: totalsW, align: 'right' });
      totalsY += 18;
    }

    // Left Column: Dynamic measurement for Bank details, Notes & Terms
    let notesY = y;
    if (inv.paymentInstructions) {
      doc.fillColor(brandColor).fontSize(8.5).font('Helvetica-Bold').text('Payment Instructions & Bank Details:', 40, notesY);
      notesY += 14;

      doc.fillColor('#475569').fontSize(8).font('Helvetica');
      const instructionsHeight = doc.heightOfString(inv.paymentInstructions, { width: 280, lineGap: 2 });
      doc.text(inv.paymentInstructions, 40, notesY, { width: 280, lineGap: 2 });
      notesY += instructionsHeight + 14;
    }

    if (inv.notes) {
      doc.fillColor('#0f172a').fontSize(8.5).font('Helvetica-Bold').text('Notes & Terms:', 40, notesY);
      notesY += 14;

      doc.fillColor('#64748b').fontSize(8).font('Helvetica');
      const notesHeight = doc.heightOfString(inv.notes, { width: 280, lineGap: 2 });
      doc.text(inv.notes, 40, notesY, { width: 280, lineGap: 2 });
      notesY += notesHeight + 14;
    }

    if (inv.termsAndConditions) {
      doc.fillColor('#0f172a').fontSize(8.5).font('Helvetica-Bold').text('Terms & Conditions:', 40, notesY);
      notesY += 14;

      doc.fillColor('#64748b').fontSize(8).font('Helvetica');
      const termsHeight = doc.heightOfString(inv.termsAndConditions, { width: 280, lineGap: 2 });
      doc.text(inv.termsAndConditions, 40, notesY, { width: 280, lineGap: 2 });
      notesY += termsHeight + 14;
    }

    // Bottom Footer
    doc.fillColor('#94a3b8').fontSize(7.5).font('Helvetica').text(
      'Thank you for your business. Generated with InvoiceAI.',
      40,
      785,
      { align: 'center', width: 515 },
    );
  }

  private buildMinimalTemplate(doc: PDFKit.PDFDocument, inv: any, brandColor: string) {
    this.buildModernTemplate(doc, inv, '#111827');
  }

  private buildCorporateTemplate(doc: PDFKit.PDFDocument, inv: any, brandColor: string) {
    this.buildModernTemplate(doc, inv, '#1e3a8a');
  }

  private buildCreativeTemplate(doc: PDFKit.PDFDocument, inv: any, brandColor: string) {
    this.buildModernTemplate(doc, inv, '#7c3aed');
  }

  private getStatusBadgeColor(status: string): string {
    switch (status) {
      case 'PAID':
        return '#059669';
      case 'PARTIALLY_PAID':
        return '#d97706';
      case 'OVERDUE':
        return '#dc2626';
      case 'CANCELLED':
        return '#6b7280';
      case 'ISSUED':
        return '#2563eb';
      case 'DRAFT':
      default:
        return '#4b5563';
    }
  }
}

