import { PartialType } from '@nestjs/mapped-types';
import { CreateAgentCategoryDto } from './create-agent-category.dto';

export class UpdateAgentCategoryDto extends PartialType(
  CreateAgentCategoryDto,
) {}
