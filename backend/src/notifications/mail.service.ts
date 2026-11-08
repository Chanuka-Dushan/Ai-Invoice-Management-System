import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { PrismaService } from '../prisma/prisma.service';
import { PdfService } from '../pdf/pdf.service';
import { format } from 'date-fns';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter: nodemailer.Transporter | null = null;

  constructor(
    private readonly prisma: PrismaService,
    private readonly pdfService: PdfService,
  ) {
    this.initTransporter();
  }

  private initTransporter() {
    const host = process.env.SMTP_HOST?.trim();
    const port = parseInt(process.env.SMTP_PORT || '2525', 10);
    const user = process.env.SMTP_USER?.trim();
    const pass = process.env.SMTP_PASS?.trim();

    if (host && user && pass) {
      this.transporter = nodemailer.createTransport({
        host,
        port,
        secure: port === 465,
        auth: { user, pass },
      });
      this.logger.log(`SMTP Mail Transporter initialized with host: ${host}:${port}`);
    } else {
      this.logger.warn(
        'SMTP credentials not fully configured in backend .env. Emails will be logged and recorded to database in simulated mode.',
      );
    }
  }

  async sendInvoiceEmail(
    invoiceId: string,
    companyId: string,
    overrideRecipient?: string,
    customNote?: string,
  ): Promise<{ success: boolean; message: string; recipient: string; emailLogId?: string }> {
    const invoice = await this.prisma.invoice.findFirst({
      where: { id: invoiceId, companyId },
      include: {
        customer: true,
        company: true,
        items: true,
      },
    });

    if (!invoice) {
      throw new NotFoundException('Invoice not found');
    }

    const recipient = overrideRecipient?.trim() || invoice.customer?.email?.trim();
    if (!recipient) {
      throw new Error('No recipient email specified and customer does not have an email address.');
    }

    const appUrl = process.env.APP_URL || 'http://localhost:5173';
    const publicUrl = invoice.publicToken
      ? `${appUrl}/view-invoice/${invoice.publicToken}`
      : `${appUrl}/invoices/${invoice.id}`;

    const subject = `Invoice ${invoice.invoiceNumber} from ${invoice.company.name}`;
    const brandColor = invoice.company.brandColor || '#4f46e5';

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; color: #1e293b; }
    .card { max-width: 580px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); }
    .header { padding: 32px 32px 24px; border-bottom: 1px solid #f1f5f9; }
    .brand-bar { height: 6px; background-color: ${brandColor}; }
    .company-title { font-size: 20px; font-weight: 800; color: #0f172a; margin: 0; }
    .body { padding: 32px; }
    .amount-box { background: #f8fafc; border-radius: 12px; padding: 20px; text-align: center; margin: 24px 0; border: 1px solid #e2e8f0; }
    .amount-title { font-size: 11px; text-transform: uppercase; font-weight: 700; color: #64748b; letter-spacing: 0.5px; }
    .amount-val { font-size: 28px; font-weight: 900; color: #0f172a; margin-top: 4px; }
    .due-text { font-size: 12px; color: #64748b; margin-top: 4px; font-weight: 500; }
    .btn { display: inline-block; background-color: ${brandColor}; color: #ffffff !important; text-decoration: none; padding: 14px 28px; border-radius: 10px; font-weight: 700; font-size: 14px; text-align: center; margin-top: 8px; }
    .custom-note { background: #eff6ff; border-left: 4px solid #3b82f6; padding: 12px 16px; font-size: 13px; color: #1e40af; border-radius: 4px; margin: 20px 0; }
    .footer { padding: 24px 32px; background: #f8fafc; font-size: 12px; color: #94a3b8; text-align: center; border-top: 1px solid #f1f5f9; }
  </style>
</head>
<body>
  <div class="card">
    <div class="brand-bar"></div>
    <div class="header">
      <h1 class="company-title">${invoice.company.name}</h1>
      <p style="margin: 4px 0 0; font-size: 13px; color: #64748b;">Invoice #${invoice.invoiceNumber}</p>
    </div>
    <div class="body">
      <p style="font-size: 14px; margin-top: 0;">Dear <strong>${invoice.customer.name}</strong>,</p>
      <p style="font-size: 14px; line-height: 1.6; color: #475569;">
        Please find your invoice <strong>${invoice.invoiceNumber}</strong> attached to this email. Here is a summary of the details:
      </p>

      <div class="amount-box">
        <div class="amount-title">Total Balance Due</div>
        <div class="amount-val">${invoice.currency} ${Number(invoice.outstandingBalance).toFixed(2)}</div>
        <div class="due-text">Payment Due: ${format(new Date(invoice.dueDate), 'MMM dd, yyyy')}</div>
      </div>

      ${customNote ? `<div class="custom-note"><strong>Note from sender:</strong><br>${customNote}</div>` : ''}

      <div style="text-align: center; margin: 28px 0;">
        <a href="${publicUrl}" class="btn">View & Pay Invoice Online</a>
      </div>

      <p style="font-size: 12px; color: #64748b; line-height: 1.5;">
        You can also review the complete invoice and bank payment instructions in the attached PDF.
      </p>
    </div>
    <div class="footer">
      Generated securely by InvoiceAI for ${invoice.company.name}.
    </div>
  </div>
</body>
</html>
`;

    // Generate PDF attachment
    let pdfBuffer: Buffer | null = null;
    try {
      pdfBuffer = await this.pdfService.generateInvoicePdf(invoice.id, invoice.companyId);
    } catch (err: any) {
      this.logger.warn(`Could not generate PDF attachment: ${err.message}`);
    }

    const fromAddress = process.env.SMTP_FROM || `${invoice.company.name} <billing@invoiceai.com>`;
    let emailStatus = 'SENT';
    let errorMessage: string | null = null;

    if (this.transporter) {
      try {
        const mailOptions: any = {
          from: fromAddress,
          to: recipient,
          subject,
          html,
        };

        if (pdfBuffer) {
          mailOptions.attachments = [
            {
              filename: `${invoice.invoiceNumber}.pdf`,
              content: pdfBuffer,
              contentType: 'application/pdf',
            },
          ];
        }

        await this.transporter.sendMail(mailOptions);
        this.logger.log(`Invoice email sent successfully to ${recipient}`);
      } catch (sendErr: any) {
        this.logger.error(`SMTP delivery failed: ${sendErr.message}`);
        emailStatus = 'FAILED';
        errorMessage = sendErr.message;
      }
    } else {
      this.logger.log(`[SIMULATED EMAIL] To: ${recipient} | Subject: ${subject}`);
      emailStatus = 'SIMULATED';
    }

    // Persist into email_logs table
    const log = await this.prisma.emailLog.create({
      data: {
        companyId,
        recipientEmail: recipient,
        subject,
        templateType: 'INVOICE_SENT',
        status: emailStatus,
        errorMessage,
      },
    });

    // Persist into audit_logs table
    await this.prisma.auditLog
      .create({
        data: {
          companyId,
          action: 'EMAIL_SENT',
          entityType: 'INVOICE',
          entityId: invoice.id,
          detailsJson: JSON.stringify({
            recipient,
            invoiceNumber: invoice.invoiceNumber,
            status: emailStatus,
          }),
        },
      })
      .catch(() => null);

    return {
      success: emailStatus !== 'FAILED',
      message:
        emailStatus === 'SIMULATED'
          ? `Invoice email simulated (SMTP not configured in .env). Sent to ${recipient}`
          : `Invoice email successfully sent to ${recipient}`,
      recipient,
      emailLogId: log.id,
    };
  }

  async sendPaymentReceipt(paymentId: string, companyId: string) {
    const payment = await this.prisma.payment.findFirst({
      where: { id: paymentId, companyId },
      include: {
        invoice: {
          include: { customer: true, company: true },
        },
      },
    });

    if (!payment) throw new NotFoundException('Payment not found');

    const recipient = payment.invoice.customer.email;
    if (!recipient) return null;

    const subject = `Payment Receipt for Invoice ${payment.invoice.invoiceNumber}`;
    const log = await this.prisma.emailLog.create({
      data: {
        companyId,
        recipientEmail: recipient,
        subject,
        templateType: 'PAYMENT_RECEIPT',
        status: this.transporter ? 'SENT' : 'SIMULATED',
      },
    });

    return log;
  }

  async getEmailLogs(companyId: string) {
    return this.prisma.emailLog.findMany({
      where: { companyId },
      orderBy: { sentAt: 'desc' },
      take: 50,
    });
  }
}

