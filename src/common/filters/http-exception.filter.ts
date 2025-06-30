import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Inject,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { LoggingService } from '../services/logging.service';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  constructor(
    @Inject(LoggingService)
    private readonly loggingService: LoggingService,
  ) {}

  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    // Extract the original response (could be string, array, or object)
    const exceptionResponse =
      exception instanceof HttpException
        ? exception.getResponse()
        : { message: 'Internal server error' };

    let message = 'Internal server error';
    let errorsObj: Record<string, string> = {};

    // Handle different message structures
    if (typeof exceptionResponse === 'string') {
      message = exceptionResponse;
    } else if (exceptionResponse && typeof exceptionResponse === 'object') {
      const errorMessage = exceptionResponse['message'];

      if (Array.isArray(errorMessage)) {
        // Handle validation errors array
        errorMessage.forEach((error: string) => {
          // Extract property and message from validation error
          const matches = error.match(/^([^:]+?)(?:\s+)(.+)$/);
          if (matches) {
            const [, property, errorMsg] = matches;
            errorsObj[property] = errorMsg;
          }
        });
        // Set first error message for meta
        message = Object.values(errorsObj)[0] || errorMessage[0] || message;
      } else if (errorMessage) {
        message = errorMessage;
      }
    }

    // Log the error with detailed information
    this.loggingService.logError(exception, 'HttpException');
    this.loggingService.logRequest(request, 'Failed Request');

    // Custom response format
    response.status(status).send({
      data: {
        errors:
          Object.keys(errorsObj).length > 0 ? errorsObj : { error: message },
      },
      meta: {
        code: status,
        status: HttpStatus[status] || 'INTERNAL_SERVER_ERROR',
        message: message,
      },
    });
  }
}
