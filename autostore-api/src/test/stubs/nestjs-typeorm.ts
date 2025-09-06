export const InjectRepository = () => () => {};
export const getRepositoryToken = (entity: { name: string }): string =>
  `${entity.name}RepositoryToken`;