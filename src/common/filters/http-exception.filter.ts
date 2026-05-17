import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
  BadRequestException,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { Prisma } from '@prisma/client';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger('ExceptionFilter');

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status: number;
    let message: string | string[] | object;
    let errors: string[] | undefined;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const raw = exception.getResponse() as any;

      // class-validator returns { message: string[], error: string }
      if (typeof raw === 'object' && Array.isArray(raw.message)) {
        errors = raw.message as string[];
        message = errors.join('; ');
      } else if (typeof raw === 'object' && typeof raw.message === 'string') {
        message = raw.message;
      } else if (typeof raw === 'string') {
        message = raw;
      } else {
        message = raw;
      }
    } else if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      switch (exception.code) {
        case 'P2002': {
          const fields = (exception.meta?.target as string[])?.join(', ') ?? 'unknown field';
          status = HttpStatus.CONFLICT;
          message = `A record with this ${fields} already exists.`;
          break;
        }
        case 'P2003': {
          const field = (exception.meta?.field_name as string) ?? 'unknown';
          status = HttpStatus.BAD_REQUEST;
          message = `Referenced record not found for field: ${field}. Make sure the ID exists.`;
          break;
        }
        case 'P2025':
          status = HttpStatus.NOT_FOUND;
          message = 'Record not found.';
          break;
        case 'P2014':
          status = HttpStatus.BAD_REQUEST;
          message = 'Relation violation: the required related record was not found.';
          break;
        default:
          status = HttpStatus.INTERNAL_SERVER_ERROR;
          message = `Database error (${exception.code}): ${exception.message}`;
      }
    } else if (exception instanceof Prisma.PrismaClientValidationError) {
      status = HttpStatus.BAD_REQUEST;
      message = 'Invalid data sent to database. Check field types and required fields.';
      this.logger.error('Prisma validation error', exception.message);
    } else {
      status = HttpStatus.INTERNAL_SERVER_ERROR;
      message = 'Internal server error';
    }

    const errorResponse: Record<string, unknown> = {
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      message: typeof message === 'object' ? (message as any).message ?? message : message,
    };

    if (errors) {
      errorResponse.errors = errors;
    }

    // Log every 400+ with full detail so debugging is easy
    if (status >= 400) {
      this.logger.warn(
        `${request.method} ${request.url} → ${status} | body: ${JSON.stringify(request.body)} | error: ${JSON.stringify(errorResponse.message)}`,
      );
    }
    if (status === HttpStatus.INTERNAL_SERVER_ERROR) {
      this.logger.error(`${request.method} ${request.url}`, (exception as Error).stack);
    }

    response.status(status).json(errorResponse);
  }
}
