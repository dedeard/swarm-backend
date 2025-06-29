import { Injectable, Logger, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';

@Injectable()
export class RequestLoggerMiddleware implements NestMiddleware {
  private readonly logger = new Logger('HTTP');

  use(request: Request, response: Response, next: NextFunction): void {
    const { ip, method, originalUrl } = request;
    const userAgent = request.get('user-agent') || '';
    const startTime = Date.now();

    response.on('finish', () => {
      const { statusCode } = response;
      const contentLength = response.get('content-length');
      const requestId = response.get('x-request-id');
      const duration = Date.now() - startTime;

      this.logger.log(
        `${method} ${originalUrl} ${statusCode} ${contentLength}b - ${duration}ms - ${userAgent} ${ip} - RequestID: ${requestId}`,
      );

      // Log additional details for non-200 responses
      if (statusCode >= 400) {
        this.logger.warn({
          method,
          url: originalUrl,
          statusCode,
          userAgent,
          ip,
          requestId,
          headers: request.headers,
          query: request.query,
          body: request.body,
          duration,
        });
      }
    });

    next();
  }
}
