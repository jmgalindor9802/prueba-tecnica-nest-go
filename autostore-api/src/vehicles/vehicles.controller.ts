import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
  Query,
  DefaultValuePipe,
  HttpCode,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBody,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiBadRequestResponse,
  ApiNotFoundResponse,
  ApiHeader,
  ApiParam,
   ApiQuery,
} from '@nestjs/swagger';
import { VehiclesService } from './vehicles.service';
import { CreateVehicleDto } from './dto/create-vehicle.dto';
import { UpdateVehicleDto } from './dto/update-vehicle.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { Role } from '../users/entities/role.enum';

@ApiTags('vehicles')
@ApiHeader({
  name: 'x-role',
  required: true,
  description: 'Rol del usuario que hace la solicitud: admin o client',
})
@UseGuards(RolesGuard)
@Controller('vehicles')
export class VehiclesController {
  constructor(private readonly vehiclesService: VehiclesService) {}

  @Post()
  @Roles(Role.Admin)
  @ApiOperation({ summary: 'Crear un nuevo vehículo' })
  @ApiBody({ type: CreateVehicleDto })
  @ApiCreatedResponse({ description: 'Vehículo creado exitosamente.' })
  @ApiBadRequestResponse({ description: 'Datos inválidos o VIN duplicado.' })
  async create(@Body() createVehicleDto: CreateVehicleDto) {
    return this.vehiclesService.create(createVehicleDto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar todos los vehículos' })
  @ApiOkResponse({ description: 'Lista de vehículos retornada.' })
    @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Número de página',
    example: 1,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Cantidad de resultados por página (máximo 50)',
    example: 10,
  })
  async findAll(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ) {
    return this.vehiclesService.findAll(page, limit);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener un vehículo por ID' })
  @ApiParam({ name: 'id', type: Number })
  @ApiOkResponse({ description: 'Vehículo encontrado.' })
  @ApiNotFoundResponse({ description: 'Vehículo no encontrado.' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.vehiclesService.findOne(id);
  }

  @Patch(':id')
  @Roles(Role.Admin)
  @ApiOperation({ summary: 'Actualizar un vehículo' })
  @ApiParam({ name: 'id', type: Number })
  @ApiOkResponse({ description: 'Vehículo actualizado.' })
  @ApiBadRequestResponse({ description: 'Datos inválidos o VIN duplicado.' })
  @ApiNotFoundResponse({ description: 'Vehículo no encontrado.' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateVehicleDto: UpdateVehicleDto,
  ) {
    return this.vehiclesService.update(id, updateVehicleDto);
  }

  @Delete(':id')
  @Roles(Role.Admin)
  @ApiOperation({ summary: 'Eliminar un vehículo' })
  @ApiParam({ name: 'id', type: Number })
  @ApiOkResponse({ description: 'Vehículo eliminado.' })
  @ApiNotFoundResponse({ description: 'Vehículo no encontrado.' })
  @HttpCode(204)
  remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.vehiclesService.remove(id);
  }
}