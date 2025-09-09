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
}
