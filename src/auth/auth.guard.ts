import { ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard as BaseAuthGuard } from '@nestjs/passport';
import { AllowedMetaData } from './auth-metadata.guard';

@Injectable()
export class AuthGuard extends BaseAuthGuard('supabase') {
  constructor(private readonly reflector: Reflector) {
    super();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const metadata = this.reflector.getAllAndOverride<AllowedMetaData[]>(
      'auth',
      [context.getHandler(), context.getClass()],
    );

    if (metadata?.includes('skip')) {
      return true;
    }

    try {
      await super.canActivate(context);
    } catch (error: any) {
      if (!metadata?.includes('optional')) {
        throw error;
      }
    }

    return true;
  }
}
