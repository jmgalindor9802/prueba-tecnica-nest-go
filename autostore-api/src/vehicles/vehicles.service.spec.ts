import { Repository } from 'typeorm';
import { VehiclesService } from './vehicles.service';
import { Vehicle } from './entities/vehicle.entity';
import { NotFoundException, BadRequestException } from '@nestjs/common';

describe('VehiclesService', () => {
  let service: VehiclesService;
  let repository: jest.Mocked<Repository<Vehicle>>;
  let cache: { get: jest.Mock; set: jest.Mock; reset: jest.Mock };

  beforeEach(() => {
    repository = {
      create: jest.fn(),
      save: jest.fn(),
      findAndCount: jest.fn(),
      findOne: jest.fn(),
      delete: jest.fn(),
      merge: jest.fn(),
    } as unknown as jest.Mocked<Repository<Vehicle>>;

     cache = {
      get: jest.fn(),
      set: jest.fn(),
      reset: jest.fn(),
    } as any;

    service = new VehiclesService(repository as any, cache as any);
  });

  it('should create vehicle and handle duplicate VIN', async () => {
    const dto = {
      brand: 'Toyota',
      model: 'Corolla',
      year: 2024,
      price: 15000.5,
      vin: '1HGCM82633A004352',
    };

    repository.create.mockImplementation((data) => data as Vehicle);
    repository.save.mockImplementation(async (vehicle) => vehicle as Vehicle);

    const result = await service.create(dto);

    expect(repository.create).toHaveBeenCalledWith(dto);
    expect(result.vin).toBe(dto.vin);
    expect(cache.reset).toHaveBeenCalled();

    repository.save.mockRejectedValue({ code: '23505' });
    await expect(service.create(dto)).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('should return paginated vehicles', async () => {
    const vehicle = { id: 1 } as Vehicle;
    repository.findAndCount.mockResolvedValue([[vehicle], 1]);
    cache.get.mockResolvedValue(undefined);

    await expect(service.findAll(1, 10)).resolves.toEqual({
      data: [vehicle],
      total: 1,
      page: 1,
      limit: 10,
    });
    expect(cache.get).toHaveBeenCalledWith('vehicles:1:10');
    expect(cache.set).toHaveBeenCalled();
    expect(repository.findAndCount).toHaveBeenCalledWith({ skip: 0, take: 10 });
  });

  it('should throw NotFoundException when vehicle not found', async () => {
    repository.findOne.mockResolvedValue(null);

    await expect(service.findOne(1)).rejects.toBeInstanceOf(NotFoundException);
  });

  it('should update vehicle fields', async () => {
    const vehicle = { id: 1, brand: 'Toyota' } as Vehicle;
    jest.spyOn(service, 'findOne').mockResolvedValue(vehicle);
    repository.merge.mockImplementation((v, dto) => ({ ...v, ...dto } as Vehicle));
    repository.save.mockImplementation(async (v) => v as Vehicle);

    const result = await service.update(1, { brand: 'Honda' });

    expect(repository.merge).toHaveBeenCalledWith(vehicle, { brand: 'Honda' });
    expect(result.brand).toBe('Honda');
    expect(repository.save).toHaveBeenCalledWith({ id: 1, brand: 'Honda' });
    expect(cache.reset).toHaveBeenCalled();
  });

  it('should delete vehicle', async () => {
    repository.delete.mockResolvedValue({ affected: 1, raw: undefined });
    await expect(service.remove(1)).resolves.toBeUndefined();
    expect(cache.reset).toHaveBeenCalled();

    repository.delete.mockResolvedValue({ affected: 0, raw: undefined });
    await expect(service.remove(1)).rejects.toBeInstanceOf(NotFoundException);
  });
});