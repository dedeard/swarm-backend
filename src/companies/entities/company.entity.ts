import { Prisma, Company as PrismaCompany } from '@prisma/client';

export interface SocialAccounts {
  twitter?: string;
  linkedin?: string;
  facebook?: string;
  instagram?: string;
  youtube?: string;
  [key: string]: string | undefined;
}

export class Company implements PrismaCompany {
  company_id: string;
  name: string;
  statutory_name: string | null;
  description: string | null;
  address: string | null;
  city: string | null;
  state_province: string | null;
  postal_code: string | null;
  country: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  website_url: string | null;
  social_accounts: Prisma.JsonValue;
  chamber_of_commerce: string | null;
  duns_number: string | null;
  tax_id: string | null;
  industry: string | null;
  founded_date: Date | null;
  company_size: string | null;
  logo_url: string | null;
  created_at: Date;
  updated_at: Date;

  get id(): string {
    return this.company_id;
  }
}
