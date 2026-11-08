import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCompanyDto, UpdateCompanyDto, AddMemberDto } from './dto/company.dto';
import { Role } from '@prisma/client';

@Injectable()
export class CompaniesService {
  constructor(private prisma: PrismaService) {}

  async createCompany(userId: string, dto: CreateCompanyDto) {
    const slugBase = dto.name
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '') || 'company';
    const slug = `${slugBase}-${Date.now().toString().slice(-4)}`;

    return this.prisma.company.create({
      data: {
        ...dto,
        slug,
        defaultCurrency: dto.defaultCurrency || 'USD',
        brandColor: dto.brandColor || '#1e3a8a',
        members: {
          create: {
            userId,
            role: Role.OWNER,
          },
        },
      },
      include: {
        members: {
          include: {
            user: {
              select: { id: true, email: true, firstName: true, lastName: true },
            },
          },
        },
      },
    });
  }

  async getUserCompanies(userId: string) {
    const memberships = await this.prisma.companyMember.findMany({
      where: { userId },
      include: {
        company: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    return memberships.map((m) => ({
      ...m.company,
      role: m.role,
    }));
  }

  async getCompanyById(companyId: string, userId: string) {
    const membership = await this.prisma.companyMember.findUnique({
      where: {
        companyId_userId: { companyId, userId },
      },
      include: {
        company: {
          include: {
            members: {
              include: {
                user: {
                  select: { id: true, email: true, firstName: true, lastName: true, avatarUrl: true },
                },
              },
            },
            _count: {
              select: {
                invoices: true,
                customers: true,
                suppliers: true,
                products: true,
              },
            },
          },
        },
      },
    });

    if (!membership) {
      throw new ForbiddenException('You are not authorized to access this company');
    }

    return {
      ...membership.company,
      role: membership.role,
    };
  }

  async updateCompany(companyId: string, dto: UpdateCompanyDto) {
    return this.prisma.company.update({
      where: { id: companyId },
      data: dto,
    });
  }

  async updateLogo(companyId: string, logoUrl: string) {
    return this.prisma.company.update({
      where: { id: companyId },
      data: { logoUrl },
    });
  }

  async removeLogo(companyId: string) {
    return this.prisma.company.update({
      where: { id: companyId },
      data: { logoUrl: null },
    });
  }

  async listMembers(companyId: string) {
    return this.prisma.companyMember.findMany({
      where: { companyId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            phone: true,
            avatarUrl: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async addMember(companyId: string, dto: AddMemberDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase().trim() },
    });

    if (!user) {
      throw new NotFoundException(`No registered user found with email ${dto.email}`);
    }

    const existingMember = await this.prisma.companyMember.findUnique({
      where: {
        companyId_userId: {
          companyId,
          userId: user.id,
        },
      },
    });

    if (existingMember) {
      return this.prisma.companyMember.update({
        where: { id: existingMember.id },
        data: { role: dto.role },
        include: { user: true },
      });
    }

    return this.prisma.companyMember.create({
      data: {
        companyId,
        userId: user.id,
        role: dto.role,
      },
      include: {
        user: {
          select: { id: true, email: true, firstName: true, lastName: true },
        },
      },
    });
  }

  async removeMember(companyId: string, memberId: string) {
    const member = await this.prisma.companyMember.findUnique({
      where: { id: memberId },
    });

    if (!member || member.companyId !== companyId) {
      throw new NotFoundException('Member not found in this company');
    }

    if (member.role === Role.OWNER) {
      const ownerCount = await this.prisma.companyMember.count({
        where: { companyId, role: Role.OWNER },
      });
      if (ownerCount <= 1) {
        throw new BadRequestException('Cannot remove the only owner of a company');
      }
    }

    await this.prisma.companyMember.delete({
      where: { id: memberId },
    });

    return { message: 'Member removed successfully' };
  }
}

