import { Module } from '@nestjs/common';
import { IncomingInvoicesService } from './incoming-invoices.service';
import { IncomingInvoicesController } from './incoming-invoices.controller';

@Module({
  controllers: [IncomingInvoicesController],
  providers: [IncomingInvoicesService],
  exports: [IncomingInvoicesService],
})
export class IncomingInvoicesModule {}

