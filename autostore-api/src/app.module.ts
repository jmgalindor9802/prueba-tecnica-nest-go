import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { VehiclesModule } from './vehicles/vehicles.module';
import { AuthModule } from './auth/auth.module';
import { OrdersModule } from './orders/orders.module';
import { PaymentsModule } from './payments/payments.module';
import { RedisModule } from './redis/redis.module';

@Module({
  imports: [
    ...(process.env.NODE_ENV === 'test'
      ? []
      : [
          // Configuración global de variables de entorno
          ConfigModule.forRoot({ isGlobal: true }),
          // Configuración de TypeORM con variables de entorno
          TypeOrmModule.forRootAsync({
            inject: [ConfigService],
            useFactory: (config: ConfigService) => ({
              type: 'postgres',
              host: config.get<string>('DB_HOST'),
              port: config.get<number>('DB_PORT'),
              username: config.get<string>('DB_USER'),
              password: config.get<string>('DB_PASS'),
              database: config.get<string>('DB_NAME'),
              autoLoadEntities: true,
              synchronize: true,
            }),
          }),
          // Nuevo módulo centralizado de Redis
          RedisModule,
          UsersModule,
          VehiclesModule,
          AuthModule,
          OrdersModule,
          PaymentsModule,
        ]),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
