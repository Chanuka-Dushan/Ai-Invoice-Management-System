import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '@prisma/client';
import { ROLES_KEY } from '../decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const companyMember = request.companyMember;

    if (!companyMember) {
      throw new ForbiddenException('Company membership context required for role verification');
    }

    const hasRole = requiredRoles.includes(companyMember.role);
    if (!hasRole) {
      throw new ForbiddenException(
        `Action requires one of the following roles: [${requiredRoles.join(', ')}]. Your role: ${companyMember.role}`,
      );
    }

    return true;
  }
}

