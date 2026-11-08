import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { SuppliersService } from './suppliers.service';
import { CreateSupplierDto, UpdateSupplierDto } from './dto/supplier.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CompanyAccessGuard } from '../common/guards/company-access.guard';
import { CurrentCompanyId } from '../common/decorators/current-company.decorator';

@UseGuards(JwtAuthGuard, CompanyAccessGuard)
@Controller('suppliers')
export class SuppliersController {
  constructor(private readonly suppliersService: SuppliersService) {}

  @Post()
  async create(
    @CurrentCompanyId() companyId: string,
    @Body() dto: CreateSupplierDto,
  ) {
    return this.suppliersService.create(companyId, dto);
  }

  @Get()
  async findAll(
    @CurrentCompanyId() companyId: string,
    @Query('search') search?: string,
  ) {
    return this.suppliersService.findAll(companyId, search);
  }

  @Get(':id')
  async findOne(
    @CurrentCompanyId() companyId: string,
    @Param('id') id: string,
  ) {
    return this.suppliersService.findOne(companyId, id);
  }

  @Put(':id')
  async update(
    @CurrentCompanyId() companyId: string,
    @Param('id') id: string,
    @Body() dto: UpdateSupplierDto,
  ) {
    return this.suppliersService.update(companyId, id, dto);
  }

  @Delete(':id')
  async delete(
    @CurrentCompanyId() companyId: string,
    @Param('id') id: string,
  ) {
    return this.suppliersService.delete(companyId, id);
  }
}

