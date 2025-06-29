import { applyDecorators, UseGuards } from '@nestjs/common';
import { ModeGuard, RequireCompanyMode } from '../guards/mode.guard';

export function CompanyMode() {
  return applyDecorators(RequireCompanyMode(), UseGuards(ModeGuard));
}
