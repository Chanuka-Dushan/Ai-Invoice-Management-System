import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class GenerateInvoiceFromTextDto {
  @IsNotEmpty({ message: 'Instruction prompt is required' })
  @IsString()
  prompt: string;
}

export class FinancialQueryDto {
  @IsNotEmpty({ message: 'Query is required' })
  @IsString()
  query: string;
}

