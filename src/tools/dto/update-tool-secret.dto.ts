import { OmitType, PartialType } from '@nestjs/mapped-types';
import { CreateToolSecretDto } from './create-tool-secret.dto';

export class UpdateToolSecretDto extends PartialType(
  OmitType(CreateToolSecretDto, ['tool_id'] as const),
) {}
