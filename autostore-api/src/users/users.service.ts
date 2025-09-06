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

const scrypt = promisify(_scrypt);

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  private async hashPassword(password: string): Promise<string> {
    const salt = randomBytes(16).toString('hex');
    const hash = (await scrypt(password, salt, 32)) as Buffer;
    return `${salt}:${hash.toString('hex')}`;
  }

  //Crear usuario
  async create(createUserDto: CreateUserDto): Promise<User> {
    try {
      const hashed = await this.hashPassword(createUserDto.password);
      const newUser = this.userRepository.create({
        ...createUserDto,
        role: createUserDto.role ?? Role.Client,
        password: hashed,
      });
      return await this.userRepository.save(newUser);
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
    const [data, total] = await this.userRepository.findAndCount({
      skip: (page - 1) * limit,
      take: limit,
    });
    return { data, total, page, limit };
  }

  async findOne(id: number): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException(`Usuario con id ${id} no encontrado`);
    }
    return user;
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
      return await this.userRepository.save(user);
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
  }
}
