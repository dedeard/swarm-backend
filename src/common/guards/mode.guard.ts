import {
  CanActivate,
  ExecutionContext,
  Injectable,
  SetMetadata,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';

export const IS_COMPANY_MODE_KEY = 'isCompanyMode';
export const RequireCompanyMode = () => SetMetadata(IS_COMPANY_MODE_KEY, true);

@Injectable()
export class ModeGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requireCompanyMode = this.reflector.getAllAndOverride<boolean>(
      IS_COMPANY_MODE_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requireCompanyMode) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const companyId = request.headers['x-company-id'];

    if (!companyId) {
      throw new UnauthorizedException(
        'This action requires a company context. Please provide an x-company-id header.',
      );
    }

    return true;
  }
}
