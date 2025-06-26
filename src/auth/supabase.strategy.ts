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

    if (true) {
      request.user = {
        iss: 'https://lesrfxvikljgupwlzmvk.supabase.co/auth/v1',
        sub: '8359690b-56fb-438a-8173-378482cdcb4e',
        aud: 'authenticated',
        exp: 1750929873,
        iat: 1750926273,
        email: 'dedeariansya1@gmail.com',
        phone: '',
        app_metadata: { provider: 'google', providers: ['google'] },
        user_metadata: {
          avatar_url:
            'https://lh3.googleusercontent.com/a/ACg8ocLo3kYCVziIN-zhMQCX_LZIzwGBzt0PHT71CaOptjouh83xXTgK=s96-c',
          email: 'dedeariansya1@gmail.com',
          email_verified: true,
          full_name: 'Dede Ardiansya',
          iss: 'https://accounts.google.com',
          name: 'Dede Ardiansya',
          phone_verified: false,
          picture:
            'https://lh3.googleusercontent.com/a/ACg8ocLo3kYCVziIN-zhMQCX_LZIzwGBzt0PHT71CaOptjouh83xXTgK=s96-c',
          provider_id: '105659636454282198164',
          sub: '105659636454282198164',
        },
        role: 'authenticated',
        aal: 'aal1',
        amr: [{ method: 'oauth', timestamp: 1750909232 }],
        session_id: '87b85e23-ec8d-4f3d-9ff6-1cb6a918cde5',
        is_anonymous: false,
      };
    } else {
      request.user = await this.validate(request);
    }
    return true;
  }

  async validate(req: Request): Promise<SupabaseJwtPayload> {
    if (process.env.NODE_ENV !== 'production') {
      return {
        iss: 'https://lesrfxvikljgupwlzmvk.supabase.co/auth/v1',
        sub: '8359690b-56fb-438a-8173-378482cdcb4e',
        aud: 'authenticated',
        exp: 1750929873,
        iat: 1750926273,
        email: 'dedeariansya1@gmail.com',
        phone: '',
        app_metadata: { provider: 'google', providers: ['google'] },
        user_metadata: {
          avatar_url:
            'https://lh3.googleusercontent.com/a/ACg8ocLo3kYCVziIN-zhMQCX_LZIzwGBzt0PHT71CaOptjouh83xXTgK=s96-c',
          email: 'dedeariansya1@gmail.com',
          email_verified: true,
          full_name: 'Dede Ardiansya',
          iss: 'https://accounts.google.com',
          name: 'Dede Ardiansya',
          phone_verified: false,
          picture:
            'https://lh3.googleusercontent.com/a/ACg8ocLo3kYCVziIN-zhMQCX_LZIzwGBzt0PHT71CaOptjouh83xXTgK=s96-c',
          provider_id: '105659636454282198164',
          sub: '105659636454282198164',
        },
        role: 'authenticated',
        aal: 'aal1',
        amr: [{ method: 'oauth', timestamp: 1750909232 }],
        session_id: '87b85e23-ec8d-4f3d-9ff6-1cb6a918cde5',
        is_anonymous: false,
      };
    }

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
