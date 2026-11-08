import { Controller, Get, Patch, Param, Body, UseGuards } from '@nestjs/common';
import { SuperAdminService } from './super-admin.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { SuperAdminGuard } from '../common/guards/super-admin.guard';

@UseGuards(JwtAuthGuard, SuperAdminGuard)
@Controller('super-admin')
export class SuperAdminController {
  constructor(private readonly superAdminService: SuperAdminService) {}

  @Get('stats')
  async getStats() {
    return this.superAdminService.getPlatformStats();
  }

  @Get('companies')
  async getCompanies() {
    return this.superAdminService.getAllCompanies();
  }

  @Get('companies/:id')
  async getCompanyDetails(@Param('id') id: string) {
    return this.superAdminService.getCompanyDetails(id);
  }

  @Patch('companies/:id/status')
  async toggleCompanyStatus(
    @Param('id') id: string,
    @Body('isActive') isActive: boolean,
  ) {
    return this.superAdminService.toggleCompanyStatus(id, isActive);
  }

  @Get('users')
  async getUsers() {
    return this.superAdminService.getAllUsers();
  }

  @Patch('users/:id/status')
  async toggleUserStatus(
    @Param('id') id: string,
    @Body('isActive') isActive: boolean,
  ) {
    return this.superAdminService.toggleUserStatus(id, isActive);
  }

  @Patch('users/:id/role')
  async toggleSuperAdminRole(
    @Param('id') id: string,
    @Body('isSuperAdmin') isSuperAdmin: boolean,
  ) {
    return this.superAdminService.toggleSuperAdminRole(id, isSuperAdmin);
  }

  @Get('audit-logs')
  async getAuditLogs() {
    return this.superAdminService.getPlatformAuditLogs();
  }
}

