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
    .setTitle('Autostore API')
    .setDescription('API REST para tienda de autos')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document, {
  swaggerOptions: {
    tagsSorter: (a, b) => {
      const order = ['auth', 'users', 'vehicles']; // orden deseado
      return order.indexOf(a) - order.indexOf(b);
    },
  },
});
  // registra primero el filtro específico y luego el genérico
  app.useGlobalFilters(new TypeOrmExceptionFilter(), new AllExceptionsFilter());

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
