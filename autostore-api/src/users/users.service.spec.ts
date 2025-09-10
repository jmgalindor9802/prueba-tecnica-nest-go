import { Repository } from 'typeorm';
import { UsersService } from './users.service';
import { User } from './entities/user.entity';
import { Role } from './entities/role.enum';
import { NotFoundException, BadRequestException } from '@nestjs/common';

describe('UsersService', () => {
  let service: UsersService;
  let repository: jest.Mocked<Repository<User>>;
  let redis: { set: jest.Mock; get: jest.Mock; del: jest.Mock };

  beforeEach(() => {
    repository = {
      create: jest.fn(),
      save: jest.fn(),
      findAndCount: jest.fn(),
      findOne: jest.fn(),
      delete: jest.fn(),
    } as unknown as jest.Mocked<Repository<User>>;

    redis = { set: jest.fn(), get: jest.fn(), del: jest.fn() };
    service = new UsersService(repository as any, redis as any);
  });

  it('should create user with hashed password and default role', async () => {
    const dto = { name: 'John', email: 'john@example.com', password: 'plain' };

    repository.create.mockImplementation((data) => data as any);
    repository.save.mockImplementation(async (user) => user as any);

    const result = await service.create(dto);

    expect(repository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        name: dto.name,
        email: dto.email,
        role: Role.Client,
      }),
    );
    expect(result.password).not.toBe(dto.password);
  });

  it('should return paginated users', async () => {
    const user = { id: 1 } as User;
    repository.findAndCount.mockResolvedValue([[user], 1]);

    await expect(service.findAll(1, 10)).resolves.toEqual({
      data: [user],
      total: 1,
      page: 1,
      limit: 10,
    });
    expect(repository.findAndCount).toHaveBeenCalledWith({ skip: 0, take: 10 });
  });

  it('should throw NotFoundException when user not found', async () => {
    repository.findOne.mockResolvedValue(null);

    await expect(service.findOne(1)).rejects.toBeInstanceOf(NotFoundException);
  });

  it('should update user fields', async () => {
    const user = { id: 1, name: 'John' } as User;
    jest.spyOn(service, 'findOne').mockResolvedValue(user);
    repository.save.mockImplementation(async (u) => u as any);

    const result = await service.update(1, { name: 'Jane' });

    expect(result.name).toBe('Jane');
    expect(repository.save).toHaveBeenCalled();
  });

  it('should delete user', async () => {
    repository.delete.mockResolvedValue({ affected: 1, raw: undefined });
    await expect(service.remove(1)).resolves.toBeUndefined();

    repository.delete.mockResolvedValue({ affected: 0, raw: undefined });
    await expect(service.remove(1)).rejects.toBeInstanceOf(NotFoundException);
  });

  it('should throw BadRequestException on duplicate email', async () => {
    const dto = { name: 'John', email: 'john@example.com', password: 'plain' };
    repository.create.mockImplementation((data) => data as any);
    repository.save.mockRejectedValue({ code: '23505' });

    await expect(service.create(dto)).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });
});
