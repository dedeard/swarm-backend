import { ApiProperty } from '@nestjs/swagger';
import {
  IsBoolean,
  IsOptional,
  IsString,
  IsUUID,
  IsUrl,
} from 'class-validator';

export class CreateToolDto {
  @ApiProperty({
    description: 'Tool owner',
    required: false,
  })
  @IsUUID()
  @IsOptional()
  user_id?: string;

  @ApiProperty({
    description: 'Associated company for multi-tenancy',
    required: false,
  })
  @IsUUID()
  @IsOptional()
  company_id?: string;

  @ApiProperty({ description: 'Tool display name' })
  @IsString()
  name: string;

  @ApiProperty({
    description: 'Tool description',
    required: false,
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    description: 'Current version',
    required: false,
  })
  @IsString()
  @IsOptional()
  version?: string;

  @ApiProperty({
    description: 'Command to install the tool',
    required: false,
  })
  @IsString()
  @IsOptional()
  cmd_install_?: string;

  @ApiProperty({
    description: 'Port number for the tool',
    required: false,
  })
  @IsString()
  @IsOptional()
  port?: string;

  @ApiProperty({
    description: 'Connection method (e.g., sse, stdio)',
    required: false,
  })
  @IsString()
  @IsOptional()
  method?: string;

  @ApiProperty({
    description: 'Environment variables configuration',
    required: false,
  })
  @IsOptional()
  env?: Record<string, any>;

  @ApiProperty({
    description: 'Required environment variables',
    required: false,
  })
  @IsOptional()
  required_env?: Record<string, any>;

  @ApiProperty({
    description: 'Tool availability status',
    required: false,
  })
  @IsString()
  @IsOptional()
  status?: string;

  @ApiProperty({
    description: 'Tool logo URL',
    required: false,
  })
  @IsUrl()
  @IsOptional()
  logo_url?: string;

  @ApiProperty({
    description: 'URL-friendly identifier',
    required: false,
  })
  @IsString()
  @IsOptional()
  slug?: string;

  @ApiProperty({
    description: 'Tool website',
    required: false,
  })
  @IsUrl()
  @IsOptional()
  website?: string;

  @ApiProperty({
    description: 'Tool developer/vendor',
    required: false,
  })
  @IsString()
  @IsOptional()
  developer?: string;

  @ApiProperty({
    description: 'Source code repository',
    required: false,
  })
  @IsString()
  @IsOptional()
  source?: string;

  @ApiProperty({
    description: 'License type',
    required: false,
  })
  @IsString()
  @IsOptional()
  license?: string;

  @ApiProperty({
    description: 'Extended description',
    required: false,
  })
  @IsString()
  @IsOptional()
  detailed_description?: string;

  @ApiProperty({
    description: 'Security considerations',
    required: false,
  })
  @IsString()
  @IsOptional()
  security_note?: string;

  @ApiProperty({
    description: 'Usage recommendations',
    required: false,
  })
  @IsOptional()
  usage_suggestions?: Record<string, any>;

  @ApiProperty({
    description: 'Available functions/capabilities',
    required: false,
  })
  @IsOptional()
  functions?: Record<string, any>;

  @ApiProperty({
    description: 'Public visibility flag',
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  is_public?: boolean;
}
