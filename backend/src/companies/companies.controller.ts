import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import * as path from 'path';
import * as fs from 'fs';
import { CompaniesService } from './companies.service';
import { CreateCompanyDto, UpdateCompanyDto, AddMemberDto } from './dto/company.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CompanyAccessGuard } from '../common/guards/company-access.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { CurrentCompanyId } from '../common/decorators/current-company.decorator';
import { Role } from '@prisma/client';

const logoStorage = diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(process.cwd(), 'uploads', 'logos');
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `logo-${uniqueSuffix}${ext}`);
  },
});

@UseGuards(JwtAuthGuard)
@Controller('companies')
export class CompaniesController {
  constructor(private readonly companiesService: CompaniesService) {}

  @Post()
  async createCompany(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateCompanyDto,
  ) {
    return this.companiesService.createCompany(userId, dto);
  }

  @Get()
  async getUserCompanies(@CurrentUser('id') userId: string) {
    return this.companiesService.getUserCompanies(userId);
  }

  @Get('active')
  @UseGuards(CompanyAccessGuard)
  async getActiveCompany(
    @CurrentUser('id') userId: string,
    @CurrentCompanyId() companyId: string,
  ) {
    return this.companiesService.getCompanyById(companyId, userId);
  }

  @Get(':id')
  async getCompanyById(
    @CurrentUser('id') userId: string,
    @Param('id') companyId: string,
  ) {
    return this.companiesService.getCompanyById(companyId, userId);
  }

  @Put('active')
  @UseGuards(CompanyAccessGuard, RolesGuard)
  @Roles(Role.OWNER, Role.ADMIN)
  async updateActiveCompany(
    @CurrentCompanyId() companyId: string,
    @Body() dto: UpdateCompanyDto,
  ) {
    return this.companiesService.updateCompany(companyId, dto);
  }

  @Post('active/logo')
  @UseGuards(CompanyAccessGuard, RolesGuard)
  @Roles(Role.OWNER, Role.ADMIN)
  @UseInterceptors(
    FileInterceptor('logo', {
      storage: logoStorage,
      limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
      fileFilter: (req, file, cb) => {
        if (!file.mimetype.match(/\/(jpg|jpeg|png|webp|svg\+xml)$/)) {
          return cb(new BadRequestException('Only image files (JPG, PNG, WebP, SVG) are allowed'), false);
        }
        cb(null, true);
      },
    }),
  )
  async uploadLogo(
    @CurrentCompanyId() companyId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('No image file uploaded');
    }
    const logoUrl = `/uploads/logos/${file.filename}`;
    return this.companiesService.updateLogo(companyId, logoUrl);
  }

  @Delete('active/logo')
  @UseGuards(CompanyAccessGuard, RolesGuard)
  @Roles(Role.OWNER, Role.ADMIN)
  async removeLogo(@CurrentCompanyId() companyId: string) {
    return this.companiesService.removeLogo(companyId);
  }

  @Get('active/members')
  @UseGuards(CompanyAccessGuard)
  async listMembers(@CurrentCompanyId() companyId: string) {
    return this.companiesService.listMembers(companyId);
  }

  @Post('active/members')
  @UseGuards(CompanyAccessGuard, RolesGuard)
  @Roles(Role.OWNER, Role.ADMIN)
  async addMember(
    @CurrentCompanyId() companyId: string,
    @Body() dto: AddMemberDto,
  ) {
    return this.companiesService.addMember(companyId, dto);
  }

  @Delete('active/members/:memberId')
  @UseGuards(CompanyAccessGuard, RolesGuard)
  @Roles(Role.OWNER, Role.ADMIN)
  async removeMember(
    @CurrentCompanyId() companyId: string,
    @Param('memberId') memberId: string,
  ) {
    return this.companiesService.removeMember(companyId, memberId);
  }
}

