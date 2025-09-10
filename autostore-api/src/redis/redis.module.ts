import { Global, Module } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { ConfigModule, ConfigService } from '@nestjs/config';
import Keyv from 'keyv';
import KeyvRedis from '@keyv/redis';
import { createClient } from '@redis/client';
import { RedisService } from './redis.service';

export const REDIS_CLIENT = 'REDIS_CLIENT';

@Global()
@Module({
  imports: [
    ConfigModule,
    CacheModule.registerAsync({
      isGlobal: true,
      inject: [ConfigService],
      useFactory: async (config: ConfigService) => {
        const url = config.get<string>('REDIS_URL') ?? 'redis://redis:6379';
        const prefix = config.get<string>('REDIS_PREFIX') ?? 'autostore';
        const ttl = config.get<number>('DEFAULT_TTL');

        const store = new Keyv({
          store: new KeyvRedis(url),
          namespace: prefix,
        });
        store.on('error', (err) => {
          console.error('Redis cache error', err);
        });

        return {
          stores: [store],
          ttl,
        };
      },
    }),
  ],
  providers: [
    {
      provide: REDIS_CLIENT,
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const url = config.get<string>('REDIS_URL') ?? 'redis://redis:6379';
        const client = createClient({
          url,
          socket: {
            reconnectStrategy: (attempts) =>
              Math.min(2 ** attempts * 100, 2000),
          },
        });

        client.on('error', (err) => {
          console.error('Redis client error', err);
        });

        // Intentar conectar pero no bloquear si falla
        client.connect().catch((err) => {
          console.error('Redis connection failed', err);
        });

        return client;
      },
    },
    RedisService,
  ],
  exports: [REDIS_CLIENT, CacheModule, RedisService],
})
export class RedisModule {}