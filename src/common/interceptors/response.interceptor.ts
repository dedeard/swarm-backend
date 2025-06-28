import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable()
export class ResponseInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      map((data) => {
        const response = context.switchToHttp().getResponse();
        const statusCode = response.statusCode;
        let message = 'Request processed successfully';

        if (statusCode === 201) message = 'Resource created successfully';
        else if (statusCode === 204) message = 'Resource updated successfully';

        return {
          data,
          meta: {
            code: statusCode,
            status: 'SUCCESS',
            message,
          },
        };
      }),
    );
  }
}
