/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './entities/user.entity';
import { Role } from './entities/role.enum';
import { randomBytes, scrypt as _scrypt } from 'crypto';
import { promisify } from 'util';
import { RedisService } from '../redis/redis.service';

const scrypt = promisify(_scrypt);
const LIST_TTL_MS = 2 * 60 * 1000;
const LIST_VER_KEY = 'users:list:ver';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly redisService: RedisService,
  ) { }

  private async hashPassword(password: string): Promise<string> {
    const salt = randomBytes(16).toString('hex');
    const hash = (await scrypt(password, salt, 32)) as Buffer;
    return `${salt}:${hash.toString('hex')}`;
  }

  private async listKey(page: number, limit: number): Promise<string> {
    const ver = (await this.redisService.get<number>(LIST_VER_KEY)) ?? 1;
    return `users:list:v${ver}:${page}:${limit}`;
  }

  private async bumpListVersion(): Promise<void> {
    await this.redisService.set(LIST_VER_KEY, Date.now(), 0);
  }

  // Crear usuario
  async create(createUserDto: CreateUserDto): Promise<User> {
    try {
      const hashed = await this.hashPassword(createUserDto.password);
      const newUser = this.userRepository.create({
        ...createUserDto,
        role: createUserDto.role ?? Role.Client,
        password: hashed,
      });
      const saved = await this.userRepository.save(newUser);
      await this.redisService.set(`user:${saved.id}`, saved);
      await this.bumpListVersion();
      return saved;
    } catch (error: any) {
      if (error?.code === '23505') {
        // 23505 = unique_violation en Postgres
        throw new BadRequestException(
          `El correo ${createUserDto.email} ya está en uso`,
        );
      }
      throw error; // deja que el filtro global maneje otros casos
    }
  }

  async findAll(
    page = 1,
    limit = 10,
  ): Promise<{ data: User[]; total: number; page: number; limit: number }> {
    const key = await this.listKey(page, limit);
    const cached = await this.redisService.get<{
      data: User[];
      total: number;
      page: number;
      limit: number;
    }>(key);
    if (cached) return cached;
    const [data, total] = await this.userRepository.findAndCount({
      skip: (page - 1) * limit,
      take: limit,
    });
    const payload = { data, total, page, limit };
    await this.redisService.set(key, payload, LIST_TTL_MS);
    return payload;
  }

  async findOne(id: number): Promise<User> {
    const key = `user:${id}`;
    const cached = await this.redisService.get<User>(key);
    if (cached) return cached;

    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException(`Usuario con id ${id} no encontrado`);
    }
    await this.redisService.set(key, user);
    return user;
  }

  async findByEmail(
    email: string,
    includePassword = false,
  ): Promise<User | null> {
    return this.userRepository.findOne({
      where: { email },
      select: includePassword
        ? ['id', 'email', 'password', 'name', 'isActive', 'role']
        : undefined,
    });
  }

  async update(id: number, updateUserDto: UpdateUserDto): Promise<User> {
    const user = await this.findOne(id);
    if (updateUserDto.password) {
      updateUserDto.password = await this.hashPassword(updateUserDto.password);
    }
    const allowed = [
      'name',
      'email',
      'password',
      'role',
    ] as (keyof UpdateUserDto)[];

    for (const field of allowed) {
      if (updateUserDto[field] !== undefined) {
        (user as any)[field] = updateUserDto[field];
      }
    }
    try {
      const saved = await this.userRepository.save(user);
      await this.redisService.set(`user:${id}`, saved);
      await this.bumpListVersion();
      return saved;
    } catch (error: any) {
      if (error?.code === '23505') {
        throw new BadRequestException(
          `El correo ${updateUserDto.email} ya está en uso`,
        );
      }
      throw error;
    }
  }

  async remove(id: number): Promise<void> {
    const result = await this.userRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Usuario con id ${id} no encontrado`);
    }
    await this.redisService.del(`user:${id}`);
    await this.bumpListVersion();
  }
}
