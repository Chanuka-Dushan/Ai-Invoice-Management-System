import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const CurrentCompanyId = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): string => {
    const request = ctx.switchToHttp().getRequest();
    // Allow reading from request.companyId (attached by CompanyAccessGuard),
    // or header 'x-company-id', or query/params
    return (
      request.companyId ||
      request.headers['x-company-id'] ||
      request.params?.companyId ||
      request.query?.companyId
    );
  },
);

