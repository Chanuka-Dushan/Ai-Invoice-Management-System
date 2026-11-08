import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class CompanyAccessGuard implements CanActivate {
  constructor(private prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user || !user.id) {
      throw new ForbiddenException('User authentication required');
    }

    const companyId =
      request.headers['x-company-id'] ||
      request.params?.companyId ||
      request.query?.companyId ||
      request.body?.companyId;

    // Super Admin platform override
    if (user.isSuperAdmin) {
      if (companyId) {
        request.companyId = companyId;
        return true;
      }
      const anyCompany = await this.prisma.company.findFirst();
      if (anyCompany) {
        request.companyId = anyCompany.id;
        return true;
      }
    }

    if (!companyId) {
      // If endpoint doesn't require company context or user has a default company
      const defaultMembership = await this.prisma.companyMember.findFirst({
        where: { userId: user.id },
        include: { company: true },
      });

      if (!defaultMembership) {
        throw new BadRequestException('No active company found for user. Please create or select a company.');
      }

      request.companyId = defaultMembership.companyId;
      request.companyMember = defaultMembership;
      return true;
    }

    const membership = await this.prisma.companyMember.findUnique({
      where: {
        companyId_userId: {
          companyId,
          userId: user.id,
        },
      },
      include: {
        company: true,
      },
    });

    if (!membership) {
      throw new ForbiddenException('You do not have permission to access data for this company.');
    }

    request.companyId = companyId;
    request.companyMember = membership;
    return true;
  }
}

