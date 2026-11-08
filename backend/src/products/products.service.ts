import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductDto, UpdateProductDto } from './dto/product.dto';

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) {}

  async create(companyId: string, dto: CreateProductDto) {
    return this.prisma.product.create({
      data: {
        companyId,
        name: dto.name,
        description: dto.description || null,
        sku: dto.sku || null,
        unitPrice: dto.unitPrice,
        taxRate: dto.taxRate || 0,
        unit: dto.unit || 'pcs',
      },
    });
  }

  async findAll(companyId: string, search?: string) {
    const whereClause: any = {
      companyId,
      isArchived: false,
    };

    if (search && search.trim()) {
      const q = search.trim();
      whereClause.OR = [
        { name: { contains: q } },
        { sku: { contains: q } },
        { description: { contains: q } },
      ];
    }

    return this.prisma.product.findMany({
      where: whereClause,
      orderBy: { name: 'asc' },
    });
  }

  async findOne(companyId: string, id: string) {
    const product = await this.prisma.product.findFirst({
      where: { id, companyId },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    return product;
  }

  async update(companyId: string, id: string, dto: UpdateProductDto) {
    await this.findOne(companyId, id);

    return this.prisma.product.update({
      where: { id },
      data: {
        name: dto.name,
        description: dto.description || null,
        sku: dto.sku || null,
        unitPrice: dto.unitPrice,
        taxRate: dto.taxRate || 0,
        unit: dto.unit || 'pcs',
      },
    });
  }

  async delete(companyId: string, id: string) {
    await this.findOne(companyId, id);

    const itemsCount = await this.prisma.invoiceItem.count({
      where: { productId: id },
    });

    if (itemsCount > 0) {
      await this.prisma.product.update({
        where: { id },
        data: { isArchived: true },
      });
      return { message: 'Product is used in historical invoices and was archived.' };
    }

    await this.prisma.product.delete({
      where: { id },
    });

    return { message: 'Product deleted successfully' };
  }
}

