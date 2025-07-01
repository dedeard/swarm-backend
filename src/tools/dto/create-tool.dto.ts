import {
  IsBoolean,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  IsUrl,
} from 'class-validator';

export class CreateToolDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  version?: string;

  @IsOptional()
  @IsString()
  cmd_install?: string;

  @IsOptional()
  @IsNumber()
  port?: number;

  @IsOptional()
  @IsString()
  method?: string;

  @IsOptional()
  @IsObject()
  env?: Record<string, any>;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  user_id?: string;

  @IsString()
  company_id: string;

  @IsOptional()
  @IsUrl()
  logo_url?: string;

  @IsOptional()
  @IsString()
  slug?: string;

  @IsOptional()
  @IsUrl()
  website?: string;

  @IsOptional()
  @IsString()
  developer?: string;

  @IsOptional()
  @IsUrl()
  source?: string;

  @IsOptional()
  @IsString()
  license?: string;

  @IsOptional()
  @IsString()
  detailed_description?: string;

  @IsOptional()
  @IsString()
  security_note?: string;

  @IsOptional()
  @IsObject()
  usage_suggestions?: Record<string, any>;

  @IsOptional()
  @IsObject()
  functions?: Record<string, any>;

  @IsOptional()
  @IsBoolean()
  is_public?: boolean;
}
