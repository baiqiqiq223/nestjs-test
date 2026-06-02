import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus } from '@nestjs/common';
import { Request, Response } from 'express';
import { ApiErrorResponse } from '../interfaces/api-response.interface';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const context = host.switchToHttp();
    const response = context.getResponse<Response>();
    const request = context.getRequest<Request>();

    const status =
      exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;

    const exceptionResponse =
      exception instanceof HttpException ? exception.getResponse() : undefined;

    const { message, errors } = this.normalizeError(exceptionResponse, status);

    const body: ApiErrorResponse = {
      code: status,
      message,
      data: null,
      timestamp: new Date().toISOString(),
      path: request.originalUrl,
      ...(errors ? { errors } : {}),
    };

    response.status(status).json(body);
  }

  private normalizeError(
    exceptionResponse: string | object | undefined,
    status: number,
  ): { message: string; errors?: unknown } {
    if (typeof exceptionResponse === 'string') {
      return { message: exceptionResponse };
    }

    if (exceptionResponse && typeof exceptionResponse === 'object') {
      const payload = exceptionResponse as {
        message?: string | string[];
        error?: string;
      };

      if (Array.isArray(payload.message)) {
        return {
          message: payload.error ?? 'Request validation failed',
          errors: payload.message,
        };
      }

      if (payload.message) {
        return { message: payload.message };
      }
    }

    return {
      message:
        status === HttpStatus.INTERNAL_SERVER_ERROR ? 'Internal server error' : 'Request failed',
    };
  }
}
