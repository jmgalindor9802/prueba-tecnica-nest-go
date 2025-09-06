import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
  HttpCode,
  UseInterceptors,
  ClassSerializerInterceptor,
  Query,
  DefaultValuePipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBody,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiNotFoundResponse,
  ApiParam,
} from '@nestjs/swagger';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@ApiTags('users')
@UseInterceptors(ClassSerializerInterceptor)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @ApiOperation({ summary: 'Crear un nuevo usuario' })
  @ApiBody({ type: CreateUserDto })
  @ApiCreatedResponse({ description: 'Usuario creado exitosamente.' })
  @ApiBadRequestResponse({ description: 'Datos inválidos.' })
  @ApiConflictResponse({ description: 'Correo ya está en uso.' })
  async create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar todos los usuarios' })
  @ApiOkResponse({ description: 'Lista de usuarios retornada.' })
  async findAll(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ) {
    return this.usersService.findAll(page, limit);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener un usuario por ID' })
  @ApiParam({ name: 'id', type: Number })
  @ApiOkResponse({ description: 'Usuario encontrado.' })
  @ApiNotFoundResponse({ description: 'Usuario no encontrado.' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar un usuario' })
  @ApiParam({ name: 'id', type: Number })
  @ApiOkResponse({ description: 'Usuario actualizado.' })
  @ApiNotFoundResponse({ description: 'Usuario no encontrado.' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    return this.usersService.update(id, updateUserDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar un usuario' })
  @ApiParam({ name: 'id', type: Number })
  @ApiOkResponse({ description: 'Usuario eliminado.' })
  @ApiNotFoundResponse({ description: 'Usuario no encontrado.' })
  @HttpCode(204)
  remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.usersService.remove(id);
  }
}
