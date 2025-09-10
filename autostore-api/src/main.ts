import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';
import { AllExceptionsFilter } from './common/filters/http-exception.filter';
import { TypeOrmExceptionFilter } from './common/filters/typeorm-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { cors: true });

  app.setGlobalPrefix('api/v1', {
    exclude: ['paypal', 'paypal/(.*)'],
  });
  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }),
  );

  const config = new DocumentBuilder()
    .setTitle('Autostore API - Prueba técnica')
     .setDescription(
      'API REST para tienda de autos. Para consumir endpoints protegidos, primero inicia sesión en /auth/login, copia el token devuelto y pégalo en el campo value en botón Authorize.'
    )
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Introduce el token con el formato: Bearer <token>',
      }
    )
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document, {
  swaggerOptions: {
    tagsSorter: (a, b) => {
      const order = ['auth', 'users', 'vehicles', 'orders', 'payments']; // orden deseado
      return order.indexOf(a) - order.indexOf(b);
    },
  },
});
  // registra primero el filtro específico y luego el genérico
  app.useGlobalFilters(new TypeOrmExceptionFilter(), new AllExceptionsFilter());

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
