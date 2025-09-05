import {
  Controller, Get, Post, Body, Patch, Param, Delete, ParseIntPipe, HttpCode
} from '@nestjs/common';
import {
  ApiTags, ApiOperation, ApiBody,
  ApiCreatedResponse, ApiOkResponse, ApiBadRequestResponse,
  ApiConflictResponse, ApiNotFoundResponse, ApiParam
} from '@nestjs/swagger';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

// DTO de salida para no exponer password
class UserResponseDto {
  id: number;            // o string si usas uuid
  email: string;
  name: string;
  isActive: boolean;
}

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @ApiOperation({ summary: 'Crear un nuevo usuario' })
  @ApiBody({ type: CreateUserDto })
  @ApiCreatedResponse({ description: 'Usuario creado exitosamente.', type: UserResponseDto })
  @ApiBadRequestResponse({ description: 'Datos inválidos.' })
  @ApiConflictResponse({ description: 'Correo ya está en uso.' })
  async create(@Body() createUserDto: CreateUserDto): Promise<UserResponseDto> {
    const user = await this.usersService.create(createUserDto);
    // map: oculta password
    const { password, ...rest } = user;
    return rest as UserResponseDto;
  }

  @Get()
  @ApiOperation({ summary: 'Listar todos los usuarios' })
  @ApiOkResponse({ description: 'Lista de usuarios retornada.', type: [UserResponseDto] })
  async findAll(): Promise<UserResponseDto[]> {
    const users = await this.usersService.findAll();
    return users.map(({ password, ...u }) => u) as UserResponseDto[];
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener un usuario por ID' })
  @ApiParam({ name: 'id', type: Number })
  @ApiOkResponse({ description: 'Usuario encontrado.', type: UserResponseDto })
  @ApiNotFoundResponse({ description: 'Usuario no encontrado.' })
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<UserResponseDto> {
    const user = await this.usersService.findOne(id);
    const { password, ...rest } = user;
    return rest as UserResponseDto;
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar un usuario' })
  @ApiParam({ name: 'id', type: Number })
  @ApiOkResponse({ description: 'Usuario actualizado.', type: UserResponseDto })
  @ApiNotFoundResponse({ description: 'Usuario no encontrado.' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateUserDto: UpdateUserDto,
  ): Promise<UserResponseDto> {
    const user = await this.usersService.update(id, updateUserDto);
    const { password, ...rest } = user;
    return rest as UserResponseDto;
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar un usuario' })
  @ApiParam({ name: 'id', type: Number })
  @ApiOkResponse({ description: 'Usuario eliminado.' })
  @ApiNotFoundResponse({ description: 'Usuario no encontrado.' })
  @HttpCode(200) // puedes usar 204 si no devuelves cuerpo
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.remove(id);
  }
}
