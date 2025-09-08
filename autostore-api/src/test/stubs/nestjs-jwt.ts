export class JwtService {
  sign(): string {
    return 'token';
  }
}

export class JwtModule {
  static register(): {
    module: typeof JwtModule;
    providers: any[];
    exports: any[];
  } {
    return {
      module: JwtModule,
      providers: [JwtService],
      exports: [JwtService],
    };
  }
}
