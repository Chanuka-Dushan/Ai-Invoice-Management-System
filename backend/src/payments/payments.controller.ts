import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { RecordPaymentDto, CreatePaymentCheckoutDto } from './dto/payment.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CompanyAccessGuard } from '../common/guards/company-access.guard';
import { CurrentCompanyId } from '../common/decorators/current-company.decorator';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  // Public checkout session creation for online invoice payments
  @Post('checkout/public/:token')
  async createPublicCheckout(
    @Param('token') token: string,
    @Body() dto: CreatePaymentCheckoutDto,
  ) {
    return this.paymentsService.createOnlineCheckoutSession(token, dto);
  }

  @UseGuards(JwtAuthGuard, CompanyAccessGuard)
  @Post()
  async recordPayment(
    @CurrentCompanyId() companyId: string,
    @Body() dto: RecordPaymentDto,
  ) {
    return this.paymentsService.recordManualPayment(companyId, dto);
  }

  @UseGuards(JwtAuthGuard, CompanyAccessGuard)
  @Get()
  async findAll(
    @CurrentCompanyId() companyId: string,
    @Query('invoiceId') invoiceId?: string,
  ) {
    return this.paymentsService.findAll(companyId, invoiceId);
  }

  @UseGuards(JwtAuthGuard, CompanyAccessGuard)
  @Get(':id')
  async findOne(
    @CurrentCompanyId() companyId: string,
    @Param('id') id: string,
  ) {
    return this.paymentsService.findOne(companyId, id);
  }

  @UseGuards(JwtAuthGuard, CompanyAccessGuard)
  @Delete(':id')
  async delete(
    @CurrentCompanyId() companyId: string,
    @Param('id') id: string,
  ) {
    return this.paymentsService.deletePayment(companyId, id);
  }
}

