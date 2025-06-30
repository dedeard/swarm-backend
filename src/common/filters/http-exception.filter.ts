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

    // Extract the original response
    const exceptionResponse =
      exception instanceof HttpException
        ? exception.getResponse()
        : { message: 'Internal server error' };

    let message = 'Internal server error';
    let errorsObj: Record<string, string> = {};

    if (typeof exceptionResponse === 'string') {
      message = exceptionResponse;
    } else if (exceptionResponse && typeof exceptionResponse === 'object') {
      const errorResponse = exceptionResponse as any;

      // Handle class-validator errors
      if (Array.isArray(errorResponse.message)) {
        errorResponse.message.forEach((error: any) => {
          if (typeof error === 'string') {
            // Handle string error messages
            const matches = error.match(/^([^:]+?)(?:\s+)(.+)$/);
            if (matches) {
              const [, property, errorMsg] = matches;
              errorsObj[property] = errorMsg;
            }
          } else if (error.property && error.constraints) {
            // Handle class-validator detailed errors
            const constraints = Object.values(error.constraints) as string[];
            errorsObj[error.property] = constraints[0] || 'Invalid value';
          }
        });

        // If no errors were extracted, try to parse the raw message
        if (Object.keys(errorsObj).length === 0) {
          errorResponse.message.forEach((error: string) => {
            const parts = error.split(' ');
            if (parts.length >= 2) {
              const property = parts[0];
              const errorMsg = parts.slice(1).join(' ');
              errorsObj[property] = errorMsg;
            }
          });
        }

        message =
          Object.values(errorsObj)[0] || errorResponse.message[0] || message;
      } else if (errorResponse.message?.constraints) {
        // Handle single property validation error
        const constraints = Object.values(
          errorResponse.message.constraints,
        ) as string[];
        message = constraints[0] || message;
        errorsObj[errorResponse.message.property] = message;
      } else if (errorResponse.message) {
        message = errorResponse.message;
      }
    }

    // Log the error with detailed information
    this.loggingService.logError(exception, 'HttpException');
    this.loggingService.logRequest(request, 'Failed Request');

    // Format the response to match the desired structure
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
