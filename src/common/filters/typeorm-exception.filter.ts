import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { QueryFailedError } from 'typeorm';

// Definimos sólo lo que nos interesa del error de Postgres
interface PgError extends Error {
  code: string;
  detail?: string;
  // puedes añadir más campos si los necesitas
}

@Catch(QueryFailedError)
export class TypeOrmExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(TypeOrmExceptionFilter.name);

  catch(exception: QueryFailedError, host: ArgumentsHost) {
    const ctx      = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request  = ctx.getRequest<Request>();

    let status  = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Database error occurred';

    // casteamos driverError a PgError
    const pgErr = exception.driverError as PgError;

    if (pgErr?.code === '23505') {
      status  = HttpStatus.CONFLICT;
      message = 'Resource already exists';
    } else if (pgErr?.code === '23503') {
      status  = HttpStatus.BAD_REQUEST;
      message = 'Referenced resource does not exist';
    }

    const errorResponse = {
      success: false,
      message,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
    };

    this.logger.error(
      `${request.method} ${request.url} ${status} - ${message}`,
      exception.stack,
    );

    response.status(status).json(errorResponse);
  }
}
