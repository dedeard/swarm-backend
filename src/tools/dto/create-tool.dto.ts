import { ApiProperty } from '@nestjs/swagger';
import { Prisma } from '@prisma/client';
import {
  IsBoolean,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  IsUrl,
} from 'class-validator';

export class CreateToolDto {
  @ApiProperty({
    description:
      'Owner user ID. If not provided, it will be the authenticated user.',
    example: '00000000-0000-0000-0000-000000000000',
    required: false,
  })
  @IsUUID()
  @IsOptional()
  user_id?: string;

  @ApiProperty({
    description: 'Associated company for multi-tenancy',
    required: false,
  })
  @IsOptional()
  company?: Prisma.CompanyCreateNestedOneWithoutToolsInput;

  @ApiProperty({ description: 'Tool name', example: 'Calculator' })
  @IsString()
  name: string;

  @ApiProperty({
    description: 'Tool description',
    example: 'A simple calculator tool',
    required: false,
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    description: 'Tool version',
    example: '1.0.0',
    required: false,
  })
  @IsString()
  @IsOptional()
  version?: string;

  @ApiProperty({
    description: 'Command to install the tool',
    example: 'npm install calculator-tool',
    required: false,
  })
  @IsString()
  @IsOptional()
  cmd_install_?: string;

  @ApiProperty({
    description: 'Port number for the tool',
    example: '8080',
    required: false,
  })
  @IsString()
  @IsOptional()
  port?: string;

  @ApiProperty({
    description: 'Connection method',
    example: 'sse',
    required: false,
  })
  @IsString()
  @IsOptional()
  method?: string;

  @ApiProperty({
    description: 'Environment variables configuration',
    example: { API_KEY: 'your-api-key' },
    required: false,
  })
  @IsOptional()
  env?: Record<string, any>;

  @ApiProperty({
    description: 'Required environment variables',
    example: { REQUIRED_VAR: 'must-have-value' },
    required: false,
  })
  @IsOptional()
  required_env?: Record<string, any>;

  @ApiProperty({
    description: 'Tool availability status',
    example: 'active',
    required: false,
  })
  @IsString()
  @IsOptional()
  status?: string;

  @ApiProperty({
    description: 'Tool logo URL',
    example: 'https://example.com/tool-logo.png',
    required: false,
  })
  @IsUrl()
  @IsOptional()
  logo_url?: string;

  @ApiProperty({
    description: 'URL-friendly identifier',
    example: 'calculator-tool',
    required: false,
  })
  @IsString()
  @IsOptional()
  slug?: string;

  @ApiProperty({
    description: 'Tool website URL',
    example: 'https://example.com/calculator-tool',
    required: false,
  })
  @IsUrl()
  @IsOptional()
  website?: string;

  @ApiProperty({
    description: 'Tool developer or vendor',
    example: 'Example Tech',
    required: false,
  })
  @IsString()
  @IsOptional()
  developer?: string;

  @ApiProperty({
    description: 'Source code repository',
    example: 'https://github.com/example/calculator-tool',
    required: false,
  })
  @IsString()
  @IsOptional()
  source?: string;

  @ApiProperty({
    description: 'License type',
    example: 'MIT',
    required: false,
  })
  @IsString()
  @IsOptional()
  license?: string;

  @ApiProperty({
    description: 'Extended tool description',
    example: 'A comprehensive calculator tool with advanced features',
    required: false,
  })
  @IsString()
  @IsOptional()
  detailed_description?: string;

  @ApiProperty({
    description: 'Security considerations',
    example: 'Requires secure API key management',
    required: false,
  })
  @IsString()
  @IsOptional()
  security_note?: string;

  @ApiProperty({
    description: 'Usage recommendations',
    example: { best_practices: ['Use in secure environments'] },
    required: false,
  })
  @IsOptional()
  usage_suggestions?: Record<string, any>;

  @ApiProperty({
    description: 'Available functions/capabilities',
    example: { add: 'Adds two numbers', subtract: 'Subtracts two numbers' },
    required: false,
  })
  @IsOptional()
  functions?: Record<string, any>;

  @ApiProperty({
    description: 'Cost of using the tool',
    example: 0.01,
    type: 'number',
    format: 'decimal',
    required: false,
  })
  @IsNumber()
  @IsOptional()
  cost?: number;

  @ApiProperty({
    description: 'Public visibility flag',
    example: false,
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  is_public?: boolean;

  @ApiProperty({
    description: 'Tool active/inactive status',
    example: true,
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  on_status?: boolean;
}
