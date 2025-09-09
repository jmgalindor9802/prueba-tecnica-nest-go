import { Repository } from 'typeorm';
import { OrdersService } from './orders.service';
import { Order, OrderStatus } from './entities/order.entity';
import { VehiclesService } from '../vehicles/vehicles.service';

describe('OrdersService', () => {
  let service: OrdersService;
  let orderRepo: jest.Mocked<Repository<Order>>;
  let vehiclesService: jest.Mocked<VehiclesService>;

  beforeEach(() => {
    orderRepo = {
      create: jest.fn(),
      save: jest.fn(),
      findOne: jest.fn(),
    } as unknown as jest.Mocked<Repository<Order>>;

    vehiclesService = {
      findOne: jest.fn(),
      markAsUnavailable: jest.fn(),
    } as unknown as jest.Mocked<VehiclesService>;

    service = new OrdersService(orderRepo as any, vehiclesService as any);
  });

  it('should create order and mark vehicles unavailable', async () => {
    const vehicle = { id: 1, price: 100, isAvailable: true } as any;
    vehiclesService.findOne.mockResolvedValue(vehicle);
    orderRepo.create.mockReturnValue({} as Order);
    orderRepo.save.mockResolvedValue({ total: 100 } as Order);

    const order = await service.create(1, [1]);

    expect(order.total).toBe(100);
    expect(vehiclesService.markAsUnavailable).toHaveBeenCalledWith(1);
  });

  it('should update status to paid', async () => {
    orderRepo.findOne.mockResolvedValue({
      id: 1,
      status: OrderStatus.PENDING,
    } as Order);
    orderRepo.save.mockImplementation(async (o) => o as Order);

    const order = await service.markAsPaid(1);
    expect(order.status).toBe(OrderStatus.PAID);
  });
});