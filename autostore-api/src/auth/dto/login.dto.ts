import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @ApiProperty({
    example: 'user@example.com',
    description: 'Correo electrónico',
  })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'password', description: 'Contraseña del usuario' })
  @IsString()
  @MinLength(6)
  password: string;
}
