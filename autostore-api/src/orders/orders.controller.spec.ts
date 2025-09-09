import { Test, TestingModule } from '@nestjs/testing';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { OrderStatus } from './entities/order.entity';

describe('OrdersController', () => {
  let controller: OrdersController;
  let service: OrdersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [OrdersController],
      providers: [
        {
          provide: OrdersService,
          useValue: { create: jest.fn(), updateStatus: jest.fn() },
        },
      ],
    }).compile();

    controller = module.get<OrdersController>(OrdersController);
    service = module.get<OrdersService>(OrdersService);
  });

  it('should delegate order creation', async () => {
    const dto: CreateOrderDto = { vehicleIds: [1] };
    (service.create as jest.Mock).mockResolvedValue('created');

    await expect(controller.create({ user: { id: 1 } }, dto)).resolves.toBe(
      'created',
    );
    expect(service.create).toHaveBeenCalledWith(1, dto.vehicleIds);
  });

  it('should delegate status update', async () => {
    const dto: UpdateOrderStatusDto = { status: OrderStatus.PAID };
    (service.updateStatus as jest.Mock).mockResolvedValue('updated');

    await expect(controller.updateStatus(1, dto)).resolves.toBe('updated');
    expect(service.updateStatus).toHaveBeenCalledWith(1, dto.status);
  });
})