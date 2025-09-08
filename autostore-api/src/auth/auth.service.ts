import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { User } from '../users/entities/user.entity';
import { promisify } from 'util';
import { scrypt as _scrypt } from 'crypto';

const scrypt = promisify(_scrypt);

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  private async verifyPassword(
    password: string,
    stored: string,
  ): Promise<boolean> {
    const [salt, hash] = stored.split(':');
    const computed = (await scrypt(password, salt, 32)) as Buffer;
    return hash === computed.toString('hex');
  }

  async validateUser(
    email: string,
    pass: string,
  ): Promise<Omit<User, 'password'> | null> {
    const user = await this.usersService.findByEmail(email, true);
    if (!user) {
      return null;
    }
    const isValid = await this.verifyPassword(pass, user.password);
    if (!isValid) {
      return null;
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...result } = user;
    return result;
  }

  async login(user: User) {
    const payload = { sub: user.id, role: user.role };
    return {
      access_token: this.jwtService.sign(payload),
    };
  }
}
