export const CACHE_MANAGER = 'CACHE_MANAGER';

export class CacheModule {
  static register(): { module: typeof CacheModule } {
    return { module: CacheModule };
  }
    static registerAsync(): { module: typeof CacheModule } {
    return { module: CacheModule };
  }
}
