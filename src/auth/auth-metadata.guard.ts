import { SetMetadata } from '@nestjs/common';

export type AllowedMetaData = 'skip' | 'optional';

export const AuthMetaData = (...metadata: AllowedMetaData[]) =>
  SetMetadata('auth', metadata);
