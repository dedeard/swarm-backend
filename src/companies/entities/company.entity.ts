import { ApiProperty } from '@nestjs/swagger';
import { Company as PrismaCompany } from '@prisma/client';

export class Company implements PrismaCompany {
  @ApiProperty({
    description: 'The id of the company',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  company_id: string;

  @ApiProperty({ description: 'Company display name', example: 'Acme Inc.' })
  name: string;

  @ApiProperty({
    description: 'Legal company name',
    example: 'Acme Corporation',
  })
  statutory_name: string | null;

  @ApiProperty({
    description: 'Company description',
    example: 'A leading provider of innovative solutions.',
  })
  description: string | null;

  @ApiProperty({ description: 'Physical address', example: '123 Main St' })
  address: string | null;

  @ApiProperty({ description: 'City location', example: 'Anytown' })
  city: string | null;

  @ApiProperty({ description: 'State or province', example: 'CA' })
  state_province: string | null;

  @ApiProperty({ description: 'ZIP/postal code', example: '12345' })
  postal_code: string | null;

  @ApiProperty({ description: 'Country code or name', example: 'USA' })
  country: string | null;

  @ApiProperty({ description: 'Contact phone number', example: '555-1234' })
  phone: string | null;

  @ApiProperty({
    description: 'Contact email address',
    example: 'contact@acme.com',
  })
  email: string | null;

  @ApiProperty({
    description: 'Company website URL',
    example: 'https://acme.com',
  })
  website: string | null;

  @ApiProperty({
    description: 'Alternative website URL',
    example: 'https://acme.org',
  })
  website_url: string | null;

  @ApiProperty({
    description: 'Social media account links',
    example: { twitter: '@acme' },
  })
  social_accounts: any;

  @ApiProperty({
    description: 'Chamber of commerce registration',
    example: '123456789',
  })
  chamber_of_commerce: string | null;

  @ApiProperty({
    description: 'DUNS business identifier',
    example: '123456789',
  })
  duns_number: string | null;

  @ApiProperty({
    description: 'Tax identification number',
    example: '987654321',
  })
  tax_id: string | null;

  @ApiProperty({
    description: 'Industry classification',
    example: 'Technology',
  })
  industry: string | null;

  @ApiProperty({
    description: 'Company founding date',
    example: '2000-01-01T00:00:00.000Z',
  })
  founded_date: Date | null;

  @ApiProperty({ description: 'Employee count category', example: '100-500' })
  company_size: string | null;

  @ApiProperty({
    description: 'Company logo URL',
    example: 'https://acme.com/logo.png',
  })
  logo_url: string | null;

  @ApiProperty({
    description: 'Record creation timestamp',
    example: '2023-01-01T00:00:00.000Z',
  })
  created_at: Date;

  @ApiProperty({
    description: 'Last update timestamp',
    example: '2023-01-01T00:00:00.000Z',
  })
  updated_at: Date;

  get id(): string {
    return this.company_id;
  }
}
