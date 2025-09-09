import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { Role } from './entities/role.enum';

describe('UsersController', () => {
  let controller: UsersController;
  let service: UsersService;

  beforeEach(async () => {
    const mockService = {
      create: jest.fn(),
      findAll: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [{ provide: UsersService, useValue: mockService }],
    }).compile();

    controller = module.get<UsersController>(UsersController);
    service = module.get<UsersService>(UsersService);
  });

  it('should delegate creation to service', async () => {
    const dto: CreateUserDto = {
      name: 'John',
      email: 'john@example.com',
      password: 'pass',
      role: Role.Client,
    };
    (service.create as jest.Mock).mockResolvedValue('created');

    await expect(controller.create(dto, {} as any)).resolves.toBe('created');
    expect(service.create).toHaveBeenCalledWith(dto);
  });

  it('should list users', async () => {
    (service.findAll as jest.Mock).mockResolvedValue('users');

    await expect(controller.findAll(1, 10)).resolves.toBe('users');
    expect(service.findAll).toHaveBeenCalledWith(1, 10);
  });

  it('should get one user', async () => {
    (service.findOne as jest.Mock).mockResolvedValue('user');

    await expect(controller.findOne(1)).resolves.toBe('user');
    expect(service.findOne).toHaveBeenCalledWith(1);
  });

  it('should update a user', async () => {
    (service.update as jest.Mock).mockResolvedValue('updated');

    await expect(controller.update(1, { name: 'Jane' })).resolves.toBe(
      'updated',
    );
    expect(service.update).toHaveBeenCalledWith(1, { name: 'Jane' });
  });

  it('should remove a user', async () => {
    (service.remove as jest.Mock).mockResolvedValue(undefined);

    await expect(controller.remove(1)).resolves.toBeUndefined();
    expect(service.remove).toHaveBeenCalledWith(1);
  });
});
