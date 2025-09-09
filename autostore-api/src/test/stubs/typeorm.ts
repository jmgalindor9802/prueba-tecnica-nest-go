export const Entity = () => () => {};
export const PrimaryGeneratedColumn = () => () => {};
export const Column = () => () => {};
export const ManyToMany = () => () => {};
export const JoinTable = () => () => {};
export const ManyToOne = () => () => {};
export const CreateDateColumn = () => () => {};
export const UpdateDateColumn = () => () => {};
export class Repository<T> {
  create = jest.fn();
  save = jest.fn();
  findAndCount = jest.fn();
  findOne = jest.fn();
  delete = jest.fn();
   update = jest.fn();
  merge = jest.fn();
}

export class EntityManager {
  save = jest.fn();
  create = jest.fn();
  update = jest.fn();
  getRepository = jest.fn(() => new Repository());
}

export class DataSource {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  transaction = async (cb: (manager: EntityManager) => Promise<any>) =>
    cb(new EntityManager());
}
