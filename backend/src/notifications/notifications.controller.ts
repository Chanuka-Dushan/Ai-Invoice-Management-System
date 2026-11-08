import { Controller, Post, Get, Param, Body, UseGuards } from '@nestjs/common';
import { IsOptional, IsString, IsEmail } from 'class-validator';
import { MailService } from './mail.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CompanyAccessGuard } from '../common/guards/company-access.guard';
import { CurrentCompanyId } from '../common/decorators/current-company.decorator';

export class SendInvoiceEmailDto {
  @IsOptional()
  @IsString()
  recipientEmail?: string;

  @IsOptional()
  @IsString()
  customNote?: string;
}

@UseGuards(JwtAuthGuard, CompanyAccessGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly mailService: MailService) {}

  @Post('send-invoice/:id')
  async sendInvoice(
    @CurrentCompanyId() companyId: string,
    @Param('id') invoiceId: string,
    @Body() dto: SendInvoiceEmailDto,
  ) {
    return this.mailService.sendInvoiceEmail(
      invoiceId,
      companyId,
      dto.recipientEmail,
      dto.customNote,
    );
  }

  @Get('email-logs')
  async getEmailLogs(@CurrentCompanyId() companyId: string) {
    return this.mailService.getEmailLogs(companyId);
  }
}

