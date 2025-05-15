import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const status = exception.getStatus();
    const errorResponse = exception.getResponse();
    
    let errorMessage: string;
    let errorDetail: any = null;
    
    if (typeof errorResponse === 'string') {
      errorMessage = errorResponse;
    } else if (typeof errorResponse === 'object') {
      errorMessage = errorResponse['message'] || 'Internal server error';
      errorDetail = errorResponse['error'] || null;
    } else {
      errorMessage = 'Internal server error';
    }
    
    // Log the error with context
    this.logger.error(
      `${request.method} ${request.url} - Status: ${status} - ${errorMessage}`,
      exception.stack,
    );
    
    // Structured error response
    const responseBody = {
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      message: errorMessage,
      error: errorDetail,
    };
    
    // Send response
    response.status(status).json(responseBody);
  }
}