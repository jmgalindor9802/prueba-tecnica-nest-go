// src/common/filters/typeorm-exception.filter.ts
import {
  Catch,
  ExceptionFilter,
  ArgumentsHost,
  HttpStatus,
} from '@nestjs/common';
import { QueryFailedError } from 'typeorm';

type DriverErr = { code?: string; detail?: string; message?: string };

@Catch(QueryFailedError)
export class TypeOrmExceptionFilter implements ExceptionFilter {
  catch(exception: QueryFailedError, host: ArgumentsHost) {
    const res = host.switchToHttp().getResponse();
    const driver: DriverErr | undefined = (exception as any)?.driverError;
    const pgCode = driver?.code;
    const detail = driver?.detail;

    if (pgCode === '23505') {
      const message = detail?.includes('(email)')
        ? 'El correo ya está en uso'
        : 'Registro duplicado';
      return res.status(HttpStatus.CONFLICT).json({
        statusCode: HttpStatus.CONFLICT,
        message,
        error: 'Unique violation',
      });
    }

    return res.status(HttpStatus.BAD_REQUEST).json({
      statusCode: HttpStatus.BAD_REQUEST,
      message: driver?.message || 'Error de base de datos',
    });
  }
}
