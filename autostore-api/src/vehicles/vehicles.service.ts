/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateVehicleDto } from './dto/create-vehicle.dto';
import { UpdateVehicleDto } from './dto/update-vehicle.dto';
import { Vehicle } from './entities/vehicle.entity';

@Injectable()
export class VehiclesService {
  constructor(
    @InjectRepository(Vehicle)
    private readonly vehicleRepository: Repository<Vehicle>,
  ) {}

  async create(createVehicleDto: CreateVehicleDto): Promise<Vehicle> {
    try {
      const vehicle = this.vehicleRepository.create(createVehicleDto);
      return await this.vehicleRepository.save(vehicle);
    } catch (error: any) {
      if (error?.code === '23505') {
        throw new BadRequestException(
          `El VIN ${createVehicleDto.vin} ya está en uso`,
        );
      }
      throw error;
    }
  }

  async findAll(
    page = 1,
    limit = 10,
  ): Promise<{ data: Vehicle[]; total: number; page: number; limit: number }> {
    const [data, total] = await this.vehicleRepository.findAndCount({
      skip: (page - 1) * limit,
      take: limit,
    });
    return { data, total, page, limit };
  }

  async findOne(id: number): Promise<Vehicle> {
    const vehicle = await this.vehicleRepository.findOne({ where: { id } });
    if (!vehicle) {
      throw new NotFoundException(`Vehículo con id ${id} no encontrado`);
    }
    return vehicle;
  }

  async update(
    id: number,
    updateVehicleDto: UpdateVehicleDto,
  ): Promise<Vehicle> {
    const vehicle = await this.findOne(id);
    const allowed = [
      'brand',
      'model',
      'year',
      'price',
      'vin',
      'description',
      'isAvailable',
    ] as (keyof UpdateVehicleDto)[];

    for (const field of allowed) {
      if (updateVehicleDto[field] !== undefined) {
        (vehicle as any)[field] = updateVehicleDto[field];
      }
    }
    try {
      return await this.vehicleRepository.save(vehicle);
    } catch (error: any) {
      if (error?.code === '23505') {
        throw new BadRequestException(
          `El VIN ${updateVehicleDto.vin} ya está en uso`,
        );
      }
      throw error;
    }
  }

  async remove(id: number): Promise<void> {
    const result = await this.vehicleRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Vehículo con id ${id} no encontrado`);
    }
  }
}