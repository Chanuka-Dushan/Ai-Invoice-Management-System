import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { IncomingInvoicesService } from './incoming-invoices.service';
import { ReviewIncomingInvoiceDto } from './dto/incoming-invoice.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CompanyAccessGuard } from '../common/guards/company-access.guard';
import { CurrentCompanyId } from '../common/decorators/current-company.decorator';
import { IncomingInvoiceStatus } from '@prisma/client';

@UseGuards(JwtAuthGuard, CompanyAccessGuard)
@Controller('incoming-invoices')
export class IncomingInvoicesController {
  constructor(private readonly incomingInvoicesService: IncomingInvoicesService) {}

  @Post('upload')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: 15 * 1024 * 1024 }, // 15MB limit
      fileFilter: (req, file, cb) => {
        if (!file.mimetype.match(/\/(pdf|jpg|jpeg|png)$/)) {
          return cb(
            new BadRequestException('Only PDF, JPG, JPEG, and PNG invoice files are supported.'),
            false,
          );
        }
        cb(null, true);
      },
    }),
  )
  async uploadInvoice(
    @CurrentCompanyId() companyId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('No invoice file uploaded.');
    }
    return this.incomingInvoicesService.processUploadedDocument(companyId, file);
  }

  @Get()
  async findAll(
    @CurrentCompanyId() companyId: string,
    @Query('status') status?: IncomingInvoiceStatus,
  ) {
    return this.incomingInvoicesService.findAll(companyId, status);
  }

  @Get(':id')
  async findOne(
    @CurrentCompanyId() companyId: string,
    @Param('id') id: string,
  ) {
    return this.incomingInvoicesService.findOne(companyId, id);
  }

  @Put(':id')
  async reviewAndSave(
    @CurrentCompanyId() companyId: string,
    @Param('id') id: string,
    @Body() dto: ReviewIncomingInvoiceDto,
  ) {
    return this.incomingInvoicesService.reviewAndSave(companyId, id, dto);
  }

  @Post(':id/approve')
  async approve(
    @CurrentCompanyId() companyId: string,
    @Param('id') id: string,
  ) {
    return this.incomingInvoicesService.approveInvoice(companyId, id);
  }

  @Post(':id/reject')
  async reject(
    @CurrentCompanyId() companyId: string,
    @Param('id') id: string,
  ) {
    return this.incomingInvoicesService.rejectInvoice(companyId, id);
  }

  @Delete(':id')
  async delete(
    @CurrentCompanyId() companyId: string,
    @Param('id') id: string,
  ) {
    return this.incomingInvoicesService.delete(companyId, id);
  }
}

