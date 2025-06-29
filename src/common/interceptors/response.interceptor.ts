import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Response as ExpressResponse } from 'express';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { v4 as uuidv4 } from 'uuid';

export interface ResponseMetadata {
  code: number;
  status: string;
  message: string;
  timestamp: string;
  requestId: string;
  duration: string;
  path: string;
}

export interface PaginationData {
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface ApiResponse<T> {
  data: T;
  meta: ResponseMetadata;
  pagination?: PaginationData;
}

@Injectable()
export class ResponseInterceptor<T>
  implements NestInterceptor<T, ApiResponse<T>>
{
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<ApiResponse<T>> {
    const startTime = Date.now();
    const request = context.switchToHttp().getRequest();
    const httpResponse = context.switchToHttp().getResponse<ExpressResponse>();

    // Generate or use existing request ID
    const requestId = request.headers['x-request-id'] || uuidv4();
    httpResponse.setHeader('x-request-id', requestId);

    return next.handle().pipe(
      map((data) => {
        const statusCode = httpResponse.statusCode;
        let message = 'Request processed successfully';

        // Set appropriate success messages based on status code
        switch (statusCode) {
          case 201:
            message = 'Resource created successfully';
            break;
          case 204:
            message = 'Resource updated successfully';
            break;
          case 200:
            message = Array.isArray(data)
              ? 'Resources retrieved successfully'
              : 'Resource retrieved successfully';
            break;
        }

        // Handle pagination if data includes it
        const pagination = data?.pagination
          ? {
              page: data.pagination.page,
              limit: data.pagination.limit,
              totalItems: data.pagination.totalItems,
              totalPages: data.pagination.totalPages,
              hasNextPage: data.pagination.hasNextPage,
              hasPreviousPage: data.pagination.hasPreviousPage,
            }
          : undefined;

        // If data has pagination info, remove it from the data object
        const responseData = data?.pagination
          ? { ...data, pagination: undefined }
          : data;

        const response: ApiResponse<T> = {
          data: responseData,
          meta: {
            code: statusCode,
            status: 'SUCCESS',
            message,
            timestamp: new Date().toISOString(),
            requestId,
            duration: `${Date.now() - startTime}ms`,
            path: request.url,
          },
        };

        // Only include pagination if it exists
        if (pagination) {
          response.pagination = pagination;
        }

        return response;
      }),
    );
  }
}
