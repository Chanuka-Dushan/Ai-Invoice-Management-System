import { Module } from '@nestjs/common';
import { ExternalApiController } from './external-api.controller';
import { ExternalApiService } from './external-api.service';
import { ApiKeyGuard } from './guards/api-key.guard';
import { NotificationsModule } from '../notifications/notifications.module';
import { PdfModule } from '../pdf/pdf.module';

@Module({
  imports: [NotificationsModule, PdfModule],
  controllers: [ExternalApiController],
  providers: [ExternalApiService, ApiKeyGuard],
  exports: [ExternalApiService],
})
export class ExternalApiModule {}
