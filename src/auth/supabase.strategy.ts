import {
  ExecutionContext,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Request } from 'express';
import * as jwt from 'jsonwebtoken';
import { Strategy } from 'passport-custom';
import { SupabaseJwtPayload } from './types';

@Injectable()
export class SupabaseStrategy extends PassportStrategy(Strategy, 'supabase') {
  private readonly logger = new Logger(SupabaseStrategy.name);

  constructor(private readonly config: ConfigService) {
    super();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    request.user = await this.validate(request);
    return true;
  }

  async validate(req: Request): Promise<SupabaseJwtPayload> {
    const token = this.extractTokenFromHeader(req.headers.authorization);
    if (!token) {
      throw new UnauthorizedException();
    }

    const secret = this.config.get<string>('JWT_SECRET');

    if (!secret) {
      this.logger.error('JWT secret is not defined in the configuration.');
      throw new UnauthorizedException('JWT secret is not defined.');
    }
    try {
      const data = jwt.verify(token, secret, {
        algorithms: ['HS256'],
      });
      return data as SupabaseJwtPayload;
    } catch (err) {
      this.logger.error(`JWT verification failed - ${err.message}`);
      throw new UnauthorizedException('Invalid or expired token.');
    }
  }

  private extractTokenFromHeader(authHeader?: string): string | null {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }

    const tokenParts = authHeader.split(' ');

    if (tokenParts.length !== 2) {
      throw new Error('Invalid authorization header format.');
    }

    return tokenParts[1];
  }
}
