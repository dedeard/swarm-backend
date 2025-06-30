import {
  IsDateString,
  IsEmail,
  IsEnum,
  IsObject,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import { SocialAccounts } from '../entities/company.entity';

enum CompanySize {
  XS = '1-10',
  S = '11-50',
  M = '51-200',
  L = '201-500',
  XL = '501-1000',
  XXL = '1000-5000',
  XXXL = '5000+',
}

export class CreateCompanyDto {
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name: string;

  @IsString()
  @IsOptional()
  @MaxLength(200)
  statutory_name?: string;

  @IsString()
  @IsOptional()
  @MaxLength(1000)
  description?: string;

  @IsString()
  @IsOptional()
  @MaxLength(200)
  address?: string;

  @IsString()
  @IsOptional()
  city?: string;

  @IsString()
  @IsOptional()
  @MinLength(2)
  @MaxLength(50)
  state_province?: string;

  @IsString()
  @IsOptional()
  @Matches(/^[0-9A-Z-]{3,10}$/, {
    message: 'Invalid postal code format',
  })
  postal_code?: string;

  @IsString()
  @IsOptional()
  country?: string;

  @IsString()
  @IsOptional()
  @Matches(/^[+]?[0-9- ()]{10,20}$/, {
    message: 'Invalid phone number format',
  })
  phone?: string;

  @IsEmail()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  @Matches(/^https?:\/\/.+/, {
    message: 'Website must be a valid URL starting with http:// or https://',
  })
  website?: string;

  @IsString()
  @IsOptional()
  @Matches(/^https?:\/\/.+/, {
    message:
      'Website URL must be a valid URL starting with http:// or https://',
  })
  website_url?: string;

  @IsObject()
  @IsOptional()
  social_accounts?: SocialAccounts;

  @IsString()
  @IsOptional()
  @Matches(/^[A-Z0-9-]{5,20}$/, {
    message: 'Invalid Chamber of Commerce registration number format',
  })
  chamber_of_commerce?: string;

  @IsString()
  @IsOptional()
  @Matches(/^[0-9]{9}$/, {
    message: 'DUNS number must be exactly 9 digits',
  })
  duns_number?: string;

  @IsString()
  @IsOptional()
  @Matches(/^[0-9-]{7,15}$/, {
    message: 'Invalid tax ID format',
  })
  tax_id?: string;

  @IsString()
  @IsOptional()
  industry?: string;

  @IsDateString()
  @IsOptional()
  founded_date?: Date;

  @IsEnum(CompanySize)
  @IsOptional()
  company_size?: CompanySize;

  @IsString()
  @IsOptional()
  @Matches(/^https?:\/\/.+/, {
    message: 'Logo URL must be a valid URL starting with http:// or https://',
  })
  logo_url?: string;
}
