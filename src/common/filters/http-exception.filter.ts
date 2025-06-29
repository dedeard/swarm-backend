import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';

interface ErrorResponse {
  message: string | string[];
  [key: string]: any;
}

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest();
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
    let stack: string | undefined;

    // Log the error with context
    this.logger.error(
      `Error processing ${request.method} ${request.url}`,
      exception instanceof Error ? exception.stack : undefined,
      {
        statusCode: status,
        path: request.url,
        method: request.method,
        timestamp: new Date().toISOString(),
      },
    );

    // Handle different message structures
    if (typeof exceptionResponse === 'string') {
      message = exceptionResponse;
    } else if (exceptionResponse && typeof exceptionResponse === 'object') {
      const errorResponse = exceptionResponse as ErrorResponse;
      const errorMessage = errorResponse.message;

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

      // Include additional error details if available
      if (errorResponse.error) {
        errorsObj.type = errorResponse.error;
      }
    }

    // Include stack trace in development environment
    if (process.env.NODE_ENV !== 'production' && exception instanceof Error) {
      stack = exception.stack;
    }

    // Custom response format
    const errorResponse = {
      data: {
        errors:
          Object.keys(errorsObj).length > 0 ? errorsObj : { error: message },
      },
      meta: {
        code: status,
        status: HttpStatus[status] || 'INTERNAL_SERVER_ERROR',
        message: message,
        timestamp: new Date().toISOString(),
        path: request.url,
        ...(stack && { stack }),
      },
    };

    response.status(status).json(errorResponse);
  }
}
