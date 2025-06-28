import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
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
    let errors: string[] = [];

    // Handle different message structures
    if (typeof exceptionResponse === 'string') {
      message = exceptionResponse;
    } else if (exceptionResponse && typeof exceptionResponse === 'object') {
      // Extract message and handle validation errors (array)
      message = exceptionResponse['message'] || message;
      if (Array.isArray(message)) {
        errors = message; // Assuming validation errors
      }
    }

    // Custom response format
    response.status(status).send({
      data: {
        errors: errors.length > 0 ? errors : [message],
      },
      meta: {
        code: status,
        status: HttpStatus[status] || 'INTERNAL_SERVER_ERROR',
        message:
          typeof message === 'string' ? message : JSON.stringify(message),
      },
    });
  }
}
