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

    // Obtener la respuesta completa de la excepción
    const exceptionResponse = exception.getResponse();

    // Si es un objeto (como en validaciones), usar ese objeto, sino usar el mensaje
    const errorResponse =
      typeof exceptionResponse === 'object'
        ? exceptionResponse
        : { message: exception.message };

    // Solo logear errores 5xx como ERROR, el resto como WARN o DEBUG
    if (status >= 500) {
      this.logger.error(
        `${request.method} ${request.url} ${status} - ${JSON.stringify(errorResponse)}`,
      );
    } else if (status >= 400) {
      this.logger.warn(
        `${request.method} ${request.url} ${status} - ${JSON.stringify(errorResponse)}`,
      );
    }

    response.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      ...errorResponse,
    });
  }
}
