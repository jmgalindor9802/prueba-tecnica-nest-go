export const InjectRepository = () => () => {};
export const getRepositoryToken = (entity: { name: string }): string =>
  `${entity.name}RepositoryToken`;

export class TypeOrmModule {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  static forRootAsync(_options?: unknown): { module: typeof TypeOrmModule } {
    return { module: TypeOrmModule };
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  static forFeature(_entities?: unknown[]): { module: typeof TypeOrmModule } {
    return { module: TypeOrmModule };
  }
}