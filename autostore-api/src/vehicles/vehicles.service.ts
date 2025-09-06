/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Inject,
} from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
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
    @Inject(CACHE_MANAGER) private readonly cache: Cache,
  ) {}

  // Limpia la caché (v6 no tiene reset())
  private async clearVehiclesCache() {
    // Opción segura: limpiar claves puntuales si las conoces con this.cache.del(key)
    // Para simplificar: intenta limpiar todo el store si está disponible
    // @ts-expect-error: store.clear puede no estar tipado pero existe en runtime
    await this.cache.store?.clear?.();
  }

  async create(createVehicleDto: CreateVehicleDto): Promise<Vehicle> {
    try {
      const vehicle = this.vehicleRepository.create(createVehicleDto);
      const saved = await this.vehicleRepository.save(vehicle);
      await this.clearVehiclesCache();
      return saved;
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
    limit = Math.min(limit, 50);

    const cacheKey = `vehicles:${page}:${limit}`;
    const cached = await this.cache.get<{
      data: Vehicle[];
      total: number;
      page: number;
      limit: number;
    }>(cacheKey);
    if (cached) return cached;

    const [data, total] = await this.vehicleRepository.findAndCount({
      skip: (page - 1) * limit,
      take: limit,
    });

    const result = { data, total, page, limit };

    // En cache-manager v6 el TTL es un número (ms), no un objeto
    await this.cache.set(cacheKey, result, 60_000);
    return result;
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
    const merged = this.vehicleRepository.merge(vehicle, updateVehicleDto);
    try {
      const saved = await this.vehicleRepository.save(merged);
      await this.clearVehiclesCache();
      return saved;
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
    await this.clearVehiclesCache();
  }
}
