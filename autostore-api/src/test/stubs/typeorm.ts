export const Entity = () => () => {};
export const PrimaryGeneratedColumn = () => () => {};
export const Column = () => () => {};
export class Repository<T> {
  create = jest.fn();
  save = jest.fn();
  findAndCount = jest.fn();
  findOne = jest.fn();
  delete = jest.fn();
}