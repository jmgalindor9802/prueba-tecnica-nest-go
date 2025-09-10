import { Inject, Injectable } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { ConfigService } from '@nestjs/config';
import type { RedisClientType } from '@redis/client';
import { REDIS_CLIENT } from './redis.module';

@Injectable()
export class RedisService {
  constructor(
    @Inject(CACHE_MANAGER) private readonly cache: Cache,
    @Inject(REDIS_CLIENT) private readonly client: RedisClientType,
    private readonly config: ConfigService,
  ) {}

  private prefix(key: string): string {
    const p = this.config.get<string>('REDIS_PREFIX');
    return p ? `${p}:${key}` : key;
  }

  async get<T>(key: string): Promise<T | null> {
    const raw = await this.cache.get<string>(this.prefix(key));
    if (!raw) return null;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  }

  async set(key: string, value: unknown, ttl?: number): Promise<void> {
    const data = JSON.stringify(value);
    const expire = ttl ?? this.config.get<number>('DEFAULT_TTL');
    await this.cache.set(this.prefix(key), data, expire);
  }

  async del(key: string): Promise<void> {
    await this.cache.del(this.prefix(key));
  }

  async lock(key: string, ttl: number): Promise<boolean> {
    try {
      const res = await this.client.set(this.prefix(key), '1', {
        NX: true,
        PX: ttl,
      } as any);
      return res === 'OK';
    } catch {
      return false;
    }
  }

  async unlock(key: string): Promise<void> {
    try {
      await this.client.del(this.prefix(key));
    } catch {
      // ignore
    }
  }
}