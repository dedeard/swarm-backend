import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsJSON, IsOptional, IsString } from 'class-validator';

export class CreateCompanyDto {
  @ApiProperty({ description: 'Company display name', example: 'Acme Inc.' })
  @IsString()
  name: string;

  @ApiProperty({
    description: 'Legal company name',
    example: 'Acme Corporation',
  })
  @IsString()
  @IsOptional()
  statutory_name?: string;

  @ApiProperty({
    description: 'Company description',
    example: 'A leading provider of innovative solutions.',
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ description: 'Physical address', example: '123 Main St' })
  @IsString()
  @IsOptional()
  address?: string;

  @ApiProperty({ description: 'City location', example: 'Anytown' })
  @IsString()
  @IsOptional()
  city?: string;

  @ApiProperty({ description: 'State or province', example: 'CA' })
  @IsString()
  @IsOptional()
  state_province?: string;

  @ApiProperty({ description: 'ZIP/postal code', example: '12345' })
  @IsString()
  @IsOptional()
  postal_code?: string;

  @ApiProperty({ description: 'Country code or name', example: 'USA' })
  @IsString()
  @IsOptional()
  country?: string;

  @ApiProperty({ description: 'Contact phone number', example: '555-1234' })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiProperty({
    description: 'Contact email address',
    example: 'contact@acme.com',
  })
  @IsString()
  @IsOptional()
  email?: string;

  @ApiProperty({
    description: 'Company website URL',
    example: 'https://acme.com',
  })
  @IsString()
  @IsOptional()
  website?: string;

  @ApiProperty({
    description: 'Alternative website URL',
    example: 'https://acme.org',
  })
  @IsString()
  @IsOptional()
  website_url?: string;

  @ApiProperty({
    description: 'Social media account links',
    example: { twitter: '@acme' },
  })
  @IsJSON()
  @IsOptional()
  social_accounts?: any;

  @ApiProperty({
    description: 'Chamber of commerce registration',
    example: '123456789',
  })
  @IsString()
  @IsOptional()
  chamber_of_commerce?: string;

  @ApiProperty({
    description: 'DUNS business identifier',
    example: '123456789',
  })
  @IsString()
  @IsOptional()
  duns_number?: string;

  @ApiProperty({
    description: 'Tax identification number',
    example: '987654321',
  })
  @IsString()
  @IsOptional()
  tax_id?: string;

  @ApiProperty({
    description: 'Industry classification',
    example: 'Technology',
  })
  @IsString()
  @IsOptional()
  industry?: string;

  @ApiProperty({
    description: 'Company founding date',
    example: '2000-01-01',
  })
  @IsDateString()
  @IsOptional()
  founded_date?: Date;

  @ApiProperty({ description: 'Employee count category', example: '100-500' })
  @IsString()
  @IsOptional()
  company_size?: string;

  @ApiProperty({
    description: 'Company logo URL',
    example: 'https://acme.com/logo.png',
  })
  @IsString()
  @IsOptional()
  logo_url?: string;
}
