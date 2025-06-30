import { Injectable, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';
import { LoggingService } from '../services/logging.service';

@Injectable()
export class RequestLoggingMiddleware implements NestMiddleware {
  constructor(private readonly loggingService: LoggingService) {}

  use(req: Request, res: Response, next: NextFunction) {
    // Log the incoming request
    this.loggingService.logRequest(req);

    // Get the start time
    const startTime = Date.now();

    // Log the response time when the request is complete
    res.on('finish', () => {
      const duration = Date.now() - startTime;
      this.loggingService.log(
        `${req.method} ${req.url} ${res.statusCode} - ${duration}ms`,
        'Request Completed',
      );
    });

    next();
  }
}
