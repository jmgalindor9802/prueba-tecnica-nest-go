import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  MinLength,
  IsString,
  IsEnum,
  IsOptional,
} from 'class-validator';
import { Role } from '../entities/role.enum';

export class CreateUserDto {
  @ApiProperty({
    example: 'Juan Pérez',
    description: 'Nombre completo del usuario',
  })
  @IsNotEmpty({ message: 'El nombre es obligatorio' })
  @IsString()
  name: string;

  @ApiProperty({
    example: 'juan@example.com',
    description: 'Correo electrónico único del usuario',
    format: 'email',
  })
  @IsNotEmpty({ message: 'El correo es obligatorio' })
  @IsString()
  @IsEmail({}, { message: 'El correo no es válido' })
  email: string;

  @ApiProperty({
    example: '123456',
    description: 'Contraseña del usuario (mínimo 6 caracteres)',
    minLength: 6,
  })
  @IsNotEmpty({ message: 'La contraseña es obligatoria' })
  @IsString()
  @MinLength(6, { message: 'La contraseña debe tener al menos 6 caracteres' })
  password: string;

  @ApiProperty({
    example: Role.Client,
    enum: Role,
    required: false,
    description: 'Rol del usuario',
    default: Role.Client,
  })
  @IsOptional()
  @IsEnum(Role, { message: 'Rol inválido' })
  role?: Role;
}
