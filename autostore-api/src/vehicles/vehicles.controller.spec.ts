import { Test, TestingModule } from '@nestjs/testing';
import { VehiclesController } from './vehicles.controller';
import { VehiclesService } from './vehicles.service';
import { CreateVehicleDto } from './dto/create-vehicle.dto';
import { UpdateVehicleDto } from './dto/update-vehicle.dto';

describe('VehiclesController', () => {
  let controller: VehiclesController;
  let service: VehiclesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [VehiclesController],
      providers: [
        {
          provide: VehiclesService,
          useValue: {
            create: jest.fn(),
            findAll: jest.fn(),
            findOne: jest.fn(),
            update: jest.fn(),
            remove: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<VehiclesController>(VehiclesController);
    service = module.get<VehiclesService>(VehiclesService);
  });

  it('should create a vehicle', async () => {
    const dto: CreateVehicleDto = {
      brand: 'Toyota',
      model: 'Corolla',
      year: 2024,
      price: 15000.5,
      vin: '1HGCM82633A004352',
      isAvailable: true,
      description: 'Auto',
    };
    const result = { id: 1, ...dto } as any;
    (service.create as jest.Mock).mockResolvedValue(result);

    await expect(controller.create(dto)).resolves.toEqual(result);
    expect(service.create).toHaveBeenCalledWith(dto);
  });

  it('should return vehicles list', async () => {
    const result = { data: [], total: 0, page: 1, limit: 10 };
    (service.findAll as jest.Mock).mockResolvedValue(result);

    await expect(controller.findAll(1, 10)).resolves.toBe(result);
    expect(service.findAll).toHaveBeenCalledWith(1, 10);
  });

  it('should return a vehicle', async () => {
    const vehicle = { id: 1 } as any;
    (service.findOne as jest.Mock).mockResolvedValue(vehicle);

    await expect(controller.findOne(1)).resolves.toBe(vehicle);
    expect(service.findOne).toHaveBeenCalledWith(1);
  });

  it('should update a vehicle', async () => {
    const dto: UpdateVehicleDto = { brand: 'Honda' };
    const vehicle = { id: 1, brand: 'Honda' } as any;
    (service.update as jest.Mock).mockResolvedValue(vehicle);

    await expect(controller.update(1, dto)).resolves.toBe(vehicle);
    expect(service.update).toHaveBeenCalledWith(1, dto);
  });

  it('should remove a vehicle', async () => {
    (service.remove as jest.Mock).mockResolvedValue(undefined);

    await expect(controller.remove(1)).resolves.toBeUndefined();
    expect(service.remove).toHaveBeenCalledWith(1);
  });
});
