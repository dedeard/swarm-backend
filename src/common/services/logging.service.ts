import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class LoggingService {
  private readonly logger = new Logger(LoggingService.name);

  log(message: string, context?: string) {
    this.logger.log(message, context);
  }

  error(message: string, trace?: string, context?: string) {
    this.logger.error(message, trace, context);
  }

  warn(message: string, context?: string) {
    this.logger.warn(message, context);
  }

  debug(message: string, context?: string) {
    this.logger.debug(message, context);
  }

  verbose(message: string, context?: string) {
    this.logger.verbose(message, context);
  }

  logRequest(req: any, context?: string) {
    const message = `${req.method} ${req.url} - ${req.ip}`;
    this.logger.log(message, context || 'HTTP Request');
  }

  logError(error: Error, context?: string) {
    this.logger.error(
      error.message,
      error.stack,
      context || 'Application Error',
    );
  }
}
