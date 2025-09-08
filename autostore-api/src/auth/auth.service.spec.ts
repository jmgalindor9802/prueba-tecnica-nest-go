import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { JwtModule } from '@nestjs/jwt';
import { Role } from '../users/entities/role.enum';
import { scryptSync, randomBytes } from 'crypto';
import { User } from '../users/entities/user.entity';

describe('AuthService', () => {
  let service: AuthService;
  let usersService: Partial<UsersService>;

  const plainPassword = 'secret';
  const salt = randomBytes(16).toString('hex');
  const storedPassword = `${salt}:${scryptSync(plainPassword, salt, 32).toString('hex')}`;

  beforeEach(async () => {
    usersService = {
      findByEmail: jest.fn().mockResolvedValue({
        id: 1,
        email: 'test@example.com',
        password: storedPassword,
        name: 'Test',
        isActive: true,
        role: Role.Client,
      } as User),
    };

    const module: TestingModule = await Test.createTestingModule({
      imports: [JwtModule.register({ secret: 'test' })],
      providers: [
        AuthService,
        { provide: UsersService, useValue: usersService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('debería validar y retornar el usuario sin contraseña', async () => {
    const user = await service.validateUser('test@example.com', plainPassword);
    expect(user).toBeDefined();
    expect((user as any).password).toBeUndefined();
  });

  it('debería retornar null con credenciales incorrectas', async () => {
    const user = await service.validateUser('test@example.com', 'wrong');
    expect(user).toBeNull();
  });
});
