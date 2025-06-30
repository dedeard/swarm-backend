import { Prisma, AgentCategory as PrismaAgentCategory } from '@prisma/client';

// Type for strongly-typed metadata in code
export interface CategoryMetadata {
  icon?: string;
  color?: string;
  displayOrder?: number;
  parentCategory?: string | null;
  allowedModels?: string[];
  defaultSettings?: {
    memory?: boolean;
    tools?: boolean;
    mediaTypes?: string[];
  };
  [key: string]: any; // Allow additional properties to match JsonValue
}

export class AgentCategory implements PrismaAgentCategory {
  category_id: string;
  name: string;
  description: string | null;
  metadata: Prisma.JsonValue;
  created_at: Date;
  updated_at: Date;

  get id(): string {
    return this.category_id;
  }
}
