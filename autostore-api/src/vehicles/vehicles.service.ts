/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import {
  Injectable,
  NotFoundException,
  ConflictException, // 409 para duplicados (23505)
  Inject,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, EntityManager } from 'typeorm';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';

import { CreateVehicleDto } from './dto/create-vehicle.dto';
import { UpdateVehicleDto } from './dto/update-vehicle.dto';
import { Vehicle } from './entities/vehicle.entity';

const VEHICLE_TTL_MS = 10 * 60 * 1000; // 10 minutos para detalles
const LIST_TTL_MS = 2 * 60 * 1000; // 2 min para listados
const LIST_VER_KEY = 'vehicles:list:ver';
const cacheKey = (id: number) => `vehicle:${id}`;

@Injectable()
export class VehiclesService {
  constructor(
    @InjectRepository(Vehicle)
    private readonly vehicleRepository: Repository<Vehicle>,
    @Inject(CACHE_MANAGER) private readonly cache: Cache,
  ) { }

  private async listKey(page: number, limit: number): Promise<string> {
    const ver = (await this.cache.get<number>(LIST_VER_KEY)) ?? 1;
    return `vehicles:list:v${ver}:${page}:${limit}`;
  }

  private async bumpListVersion(): Promise<void> {
    await this.cache.set(LIST_VER_KEY, Date.now(), 0); // 0 = sin TTL
  }

  async create(dto: CreateVehicleDto): Promise<Vehicle> {
    try {
      const vin = dto.vin.trim().toUpperCase();
      const entity = this.vehicleRepository.create({ ...dto, vin });
      const saved = await this.vehicleRepository.save(entity);
      await this.bumpListVersion();
      return saved;
    } catch (error: any) {
      const code = error?.code ?? error?.driverError?.code;
      if (code === '23505') {
        throw new ConflictException(`El VIN ${dto.vin} ya está en uso`);
      }
      throw error;
    }
  }

  async findAll(
    page = 1,
    limit = 10,
  ): Promise<{ data: Vehicle[]; total: number; page: number; limit: number }> {
    page = Math.max(1, page);
    limit = Math.min(Math.max(1, limit), 50);

    const key = await this.listKey(page, limit);
    const cached = await this.cache.get<{
      data: Vehicle[];
      total: number;
      page: number;
      limit: number;
    }>(key);
    if (cached) return cached;

    const [data, total] = await this.vehicleRepository.findAndCount({
      skip: (page - 1) * limit,
      take: limit,
    });

    const payload = { data, total, page, limit };
    await this.cache.set(key, payload, LIST_TTL_MS);
    return payload;
  }

  async findOne(id: number): Promise<Vehicle> {
    const key = cacheKey(id);
    const cached = await this.cache.get<Vehicle>(key);
    if (cached) return cached;

    const vehicle = await this.vehicleRepository.findOne({ where: { id } });
    if (!vehicle) {
      throw new NotFoundException(`Vehículo con id ${id} no encontrado`);
    }
    await this.cache.set(key, vehicle, VEHICLE_TTL_MS);
    return vehicle;
  }

  async update(id: number, dto: UpdateVehicleDto): Promise<Vehicle> {
    const current = await this.findOne(id);

    const vin = dto.vin ? dto.vin.trim().toUpperCase() : undefined;
    const merged = this.vehicleRepository.merge(current, {
      ...dto,
      ...(vin ? { vin } : {}),
    });

    try {
      const updated = await this.vehicleRepository.save(merged);
      await this.cache.set(cacheKey(id), updated, VEHICLE_TTL_MS);
      await this.bumpListVersion();
      return updated;
    } catch (error: any) {
      const code = error?.code ?? error?.driverError?.code;
      if (code === '23505') {
        throw new ConflictException(
          `El VIN ${dto.vin ?? merged.vin} ya está en uso`,
        );
      }
      throw error;
    }
  }
  async markAsUnavailable(
    id: number,
    manager?: EntityManager,
  ): Promise<void> {
    const repo = manager
      ? manager.getRepository(Vehicle)
      : this.vehicleRepository;
    const result = await repo.update(id, {
      isAvailable: false,
    });
    if (result.affected === 0) {
      throw new NotFoundException(`Vehículo con id ${id} no encontrado`);
    }
    await this.cache.del(cacheKey(id));
    await this.bumpListVersion();
  }
  async markAsAvailable(
    id: number,
    manager?: EntityManager,
  ): Promise<void> {
    const repo = manager
      ? manager.getRepository(Vehicle)
      : this.vehicleRepository;
    const result = await repo.update(id, {
      isAvailable: true,
    });
    if (result.affected === 0) {
      throw new NotFoundException(`Vehículo con id ${id} no encontrado`);
    }
    await this.cache.del(cacheKey(id));
    await this.bumpListVersion();
  }
  async remove(id: number): Promise<void> {
    const result = await this.vehicleRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Vehículo con id ${id} no encontrado`);
    }
    await this.cache.del(cacheKey(id));
    await this.bumpListVersion();
  }
}
