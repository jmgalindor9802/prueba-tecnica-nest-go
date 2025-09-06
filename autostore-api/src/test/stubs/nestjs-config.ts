export class ConfigService {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  get<T = unknown>(_key: string): T | undefined {
    return undefined;
  }
}

export class ConfigModule {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  static forRoot(_options?: unknown): { module: typeof ConfigModule } {
    return { module: ConfigModule };
  }
}
