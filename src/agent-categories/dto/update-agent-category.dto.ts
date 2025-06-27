import { PartialType } from '@nestjs/swagger';
import { CreateAgentCategoryDto } from './create-agent-category.dto';

export class UpdateAgentCategoryDto extends PartialType(
  CreateAgentCategoryDto,
) {}
