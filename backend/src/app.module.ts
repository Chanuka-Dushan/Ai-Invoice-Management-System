import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { CompaniesModule } from './companies/companies.module';
import { CustomersModule } from './customers/customers.module';
import { SuppliersModule } from './suppliers/suppliers.module';
import { ProductsModule } from './products/products.module';
import { InvoicesModule } from './invoices/invoices.module';
import { AiModule } from './ai/ai.module';
import { VoiceModule } from './voice/voice.module';
import { IncomingInvoicesModule } from './incoming-invoices/incoming-invoices.module';
import { PaymentsModule } from './payments/payments.module';
import { ReportsModule } from './reports/reports.module';
import { PdfModule } from './pdf/pdf.module';
import { NotificationsModule } from './notifications/notifications.module';
import { SuperAdminModule } from './super-admin/super-admin.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    CompaniesModule,
    CustomersModule,
    SuppliersModule,
    ProductsModule,
    InvoicesModule,
    AiModule,
    VoiceModule,
    IncomingInvoicesModule,
    PaymentsModule,
    ReportsModule,
    PdfModule,
    NotificationsModule,
    SuperAdminModule,
  ],
})
export class AppModule {}

