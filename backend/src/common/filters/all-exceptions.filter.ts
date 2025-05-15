import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  constructor(private readonly httpAdapterHost: HttpAdapterHost) {}

  catch(exception: any, host: ArgumentsHost): void {
    // In certain situations `httpAdapter` might not be available in the
    // constructor method, thus we should resolve it here.
    const { httpAdapter } = this.httpAdapterHost;

    const ctx = host.switchToHttp();
    const request = ctx.getRequest();
    
    // Default to internal server error
    const httpStatus = 
      exception.getStatus?.() || 
      HttpStatus.INTERNAL_SERVER_ERROR;
    
    const message = 
      exception.message || 
      'Internal server error';
    
    // Log the error with context
    this.logger.error(
      `Unhandled exception: ${exception.message || 'Unknown error'}`,
      exception.stack,
      `${request.method} ${request.url}`,
    );
    
    // Structured error response
    const responseBody = {
      statusCode: httpStatus,
      timestamp: new Date().toISOString(),
      path: httpAdapter.getRequestUrl(request),
      method: httpAdapter.getRequestMethod(request),
      message: httpStatus !== HttpStatus.INTERNAL_SERVER_ERROR
        ? message
        : 'Internal server error',
      error: exception.name || 'InternalServerError',
    };

    // Send response
    httpAdapter.reply(ctx.getResponse(), responseBody, httpStatus);
  }
}