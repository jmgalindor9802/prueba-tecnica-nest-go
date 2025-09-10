import { Repository } from 'typeorm';
import { VehiclesService } from './vehicles.service';
import { Vehicle } from './entities/vehicle.entity';
import { NotFoundException, ConflictException } from '@nestjs/common';
import { RedisService } from '../redis/redis.service';

describe('VehiclesService', () => {
  let service: VehiclesService;
  let repository: jest.Mocked<Repository<Vehicle>>;
  let redis: jest.Mocked<RedisService>;

  beforeEach(() => {
    repository = {
      create: jest.fn(),
      save: jest.fn(),
      findAndCount: jest.fn(),
      findOne: jest.fn(),
      delete: jest.fn(),
      merge: jest.fn(),
    } as unknown as jest.Mocked<Repository<Vehicle>>;

    redis = {
      get: jest.fn(),
      set: jest.fn(),
      del: jest.fn(),
    } as unknown as jest.Mocked<RedisService>;

    service = new VehiclesService(repository as any, redis as any);
  });

  it('should create vehicle, bump list version, and handle duplicate VIN', async () => {
    const dto = {
      brand: 'Toyota',
      model: 'Corolla',
      year: 2024,
      price: 15000.5,
      vin: '1hgcm82633a004352', // minúsculas para validar normalización
    };

    repository.create.mockImplementation((data) => data as Vehicle);
    repository.save.mockImplementation(async (v) => v as Vehicle);

    const created = await service.create(dto);

    // Normaliza VIN a upper
    expect(repository.create).toHaveBeenCalledWith({
      ...dto,
      vin: dto.vin.toUpperCase(),
    });
    expect(created.vin).toBe(dto.vin.toUpperCase());

    // Bump de versión de listas
    expect(redis.set).toHaveBeenCalledWith(
      'vehicles:list:ver',
      expect.any(Number),
      0,
    );

    // Duplicado -> 409
    repository.save.mockRejectedValueOnce({ code: '23505' });
    await expect(service.create(dto)).rejects.toBeInstanceOf(ConflictException);
  });

  it('should return paginated vehicles and set cache on miss', async () => {

    redis.get
      .mockResolvedValueOnce(undefined) // LIST_VER_KEY
      .mockResolvedValueOnce(undefined); // lista

    const vehicle = { id: 1 } as Vehicle;
    repository.findAndCount.mockResolvedValue([[vehicle], 1]);

    await expect(service.findAll(1, 10)).resolves.toEqual({
      data: [vehicle],
      total: 1,
      page: 1,
      limit: 10,
    });

    // se debe haber seteado el caché de la lista
    expect(redis.set).toHaveBeenCalledWith(
      'vehicles:list:v1:1:10',
      { data: [vehicle], total: 1, page: 1, limit: 10 },
      expect.any(Number),
    );
  });

  it('should return cached list when present', async () => {

    const payload = {
      data: [{ id: 2 } as Vehicle],
      total: 1,
      page: 2,
      limit: 5,
    };
    redis.get
      .mockResolvedValueOnce(1 as any) // LIST_VER_KEY
      .mockResolvedValueOnce(payload); // lista cacheada

    const result = await service.findAll(2, 5);

    expect(result).toEqual(payload);
    expect(repository.findAndCount).not.toHaveBeenCalled();
  });

  it('should return cached vehicle when present', async () => {
    const vehicle = { id: 1 } as Vehicle;
    redis.get.mockResolvedValueOnce(vehicle);

    const result = await service.findOne(1);
    expect(result).toBe(vehicle);
    expect(repository.findOne).not.toHaveBeenCalled();
  });

  it('should throw NotFoundException when vehicle not found (cache miss)', async () => {
    redis.get.mockResolvedValueOnce(undefined);
    repository.findOne.mockResolvedValueOnce(null);

    await expect(service.findOne(1)).rejects.toBeInstanceOf(NotFoundException);
  });

  it('should set cache on miss and return vehicle', async () => {
    const vehicle = { id: 1 } as Vehicle;
    redis.get.mockResolvedValueOnce(undefined);
    repository.findOne.mockResolvedValueOnce(vehicle);

    const result = await service.findOne(1);
    expect(result).toBe(vehicle);
    expect(redis.set).toHaveBeenCalledWith(
      'vehicle:1',
      vehicle,
      expect.any(Number),
    );
  });

  it('should update vehicle, refresh detail cache and bump list version', async () => {
    const vehicle = { id: 1, brand: 'Toyota', vin: 'ABC' } as Vehicle;
    jest.spyOn(service, 'findOne').mockResolvedValueOnce(vehicle);

    repository.merge.mockImplementation(
      (v, dto) => ({ ...v, ...dto }) as Vehicle,
    );
    repository.save.mockImplementation(async (v) => v as Vehicle);

    const updated = await service.update(1, { brand: 'Honda' });

    expect(repository.merge).toHaveBeenCalledWith(vehicle, { brand: 'Honda' });
    expect(updated.brand).toBe('Honda');

    // refresca cache de detalle
    expect(redis.set).toHaveBeenCalledWith(
      'vehicle:1',
      updated,
      expect.any(Number),
    );

    expect(redis.set).toHaveBeenCalledWith(
      'vehicles:list:ver',
      expect.any(Number),
      0,
    );
  });

  it('should delete vehicle, evict detail cache and bump list version', async () => {
    repository.delete.mockResolvedValueOnce({ affected: 1, raw: undefined });

    await expect(service.remove(1)).resolves.toBeUndefined();

    expect(redis.del).toHaveBeenCalledWith('vehicle:1'); // borra detalle
    expect(redis.set).toHaveBeenCalledWith(
      'vehicles:list:ver',
      expect.any(Number),
      0,
    ); // bump listas
  });

  it('should throw NotFoundException when delete affects 0 rows', async () => {
    repository.delete.mockResolvedValueOnce({ affected: 0, raw: undefined });
    await expect(service.remove(1)).rejects.toBeInstanceOf(NotFoundException);
  });
});
