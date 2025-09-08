export function AuthGuard() {
  return class {
    canActivate() {
      return true;
    }
  };
}

export class PassportModule {
  static register(): { module: typeof PassportModule } {
    return { module: PassportModule };
  }
}
