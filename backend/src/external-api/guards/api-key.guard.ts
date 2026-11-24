import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    let apiKey = request.headers['x-api-key'];
    if (!apiKey) {
      const authHeader = request.headers['authorization'];
      if (authHeader && typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
        apiKey = authHeader.substring(7).trim();
      }
    }

    if (!apiKey || typeof apiKey !== 'string' || !apiKey.startsWith('inv_')) {
      throw new UnauthorizedException(
        'Missing or invalid API Key. Please provide your InvoiceAI API key in the X-API-KEY header (e.g. X-API-KEY: inv_live_...).',
      );
    }

    const company = await this.prisma.company.findUnique({
      where: { apiKey: apiKey.trim() },
    });

    if (!company) {
      throw new UnauthorizedException(
        'Invalid API Key. No matching company found for the provided key.',
      );
    }

    if (!company.isActive) {
      throw new UnauthorizedException(
        'The business organization associated with this API key has been suspended.',
      );
    }

    request.company = company;
    request.companyId = company.id;
    return true;
  }
}
