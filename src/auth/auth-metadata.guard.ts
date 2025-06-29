import {
  CanActivate,
  ExecutionContext,
  Injectable,
  SetMetadata,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';

export type AllowedMetaData = 'skip' | 'optional';
export const AUTH_METADATA_KEY = 'auth';

export const AuthMetaData = (...metadata: AllowedMetaData[]) =>
  SetMetadata(AUTH_METADATA_KEY, metadata);

@Injectable()
export class AuthMetadataGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const metadata = this.reflector.get<AllowedMetaData[]>(
      AUTH_METADATA_KEY,
      context.getHandler(),
    );

    // If no metadata is set, allow the request
    if (!metadata) {
      return true;
    }

    // Check if auth can be skipped
    if (metadata.includes('skip')) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    // If auth is optional, allow even without user
    if (metadata.includes('optional')) {
      return true;
    }

    // For any other metadata, require user to be present
    return !!user;
  }
}
