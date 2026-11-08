import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { AiService } from './ai.service';
import { GenerateInvoiceFromTextDto, FinancialQueryDto } from './dto/ai-prompt.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CompanyAccessGuard } from '../common/guards/company-access.guard';
import { CurrentCompanyId } from '../common/decorators/current-company.decorator';

@UseGuards(JwtAuthGuard, CompanyAccessGuard)
@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('generate-invoice')
  async generateInvoice(
    @CurrentCompanyId() companyId: string,
    @Body() dto: GenerateInvoiceFromTextDto,
  ) {
    return this.aiService.generateInvoiceFromText(companyId, dto.prompt);
  }

  @Post('assistant/ask')
  async askFinancialAssistant(
    @CurrentCompanyId() companyId: string,
    @Body() dto: FinancialQueryDto,
  ) {
    return this.aiService.answerFinancialQuestion(companyId, dto.query);
  }
}

