import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { QueryFailedError } from 'typeorm';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string | object = 'Error interno del servidor';

    // 1️⃣ Prioridad: errores de base de datos
    if (exception instanceof QueryFailedError) {
      const err: any = exception;
      if (err.code === '23505') {
        status = HttpStatus.BAD_REQUEST;
        message = 'El correo ya está en uso';
      }
    }
    // 2️⃣ Errores HTTP estándar de Nest
    else if (exception instanceof HttpException) {
      status = exception.getStatus();
      message = exception.getResponse();
    }

    console.error('🔴 ERROR CAPTURADO:', exception);

    response.status(status).json({
      statusCode: status,
      message: typeof message === 'string' ? message : (message as any).message,
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }
}
