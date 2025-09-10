import { Test, TestingModule } from '@nestjs/testing';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { CancelOrderDto } from './dto/cancel-order.dto';
import { Role } from '../users/entities/role.enum';

describe('OrdersController', () => {
    let controller: OrdersController;
    let service: OrdersService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [OrdersController],
            providers: [
                {
                    provide: OrdersService,
                    useValue: {
                        create: jest.fn(),
                        findAll: jest.fn(),
                        findOne: jest.fn(),
                        cancel: jest.fn(),
                        markAsShipped: jest.fn(),
                    },
                },
            ],
        }).compile();

        controller = module.get<OrdersController>(OrdersController);
        service = module.get<OrdersService>(OrdersService);
    });

    it('should delegate order creation', async () => {
        const dto: CreateOrderDto = {
            vehicleIds: [1],
            shippingAddress: 'Calle 1',
        } as any;
        (service.create as jest.Mock).mockResolvedValue('created');

        await expect(controller.create({ user: { id: 1 } }, dto)).resolves.toBe(
            'created',
        );
        expect(service.create).toHaveBeenCalledWith(
            1,
            dto.vehicleIds,
            dto.shippingAddress,
            dto.notes,
        );
    });

    it('should delegate listing', async () => {
        (service.findAll as jest.Mock).mockResolvedValue('list');
        await expect(
            controller.findAll({ user: { id: 1, role: Role.Client } }),
        ).resolves.toBe('list');
        expect(service.findAll).toHaveBeenCalledWith(1, Role.Client);
    });

    it('should delegate detail retrieval', async () => {
        (service.findOne as jest.Mock).mockResolvedValue('order');
        await expect(
            controller.findOne({ user: { id: 1, role: Role.Client } }, 2),
        ).resolves.toBe('order');
        expect(service.findOne).toHaveBeenCalledWith(2, 1, Role.Client);
    });

    it('should delegate cancellation', async () => {
        const dto: CancelOrderDto = { reason: 'no quiero' };
        (service.cancel as jest.Mock).mockResolvedValue('cancelled');
        await expect(
            controller.cancel({ user: { id: 1, role: Role.Client } }, 3, dto),
        ).resolves.toBe('cancelled');
        expect(service.cancel).toHaveBeenCalledWith(3, 1, Role.Client, dto.reason);
    });

    it('should delegate mark as shipped', async () => {
    (service.markAsShipped as jest.Mock).mockResolvedValue('shipped');
    await expect(controller.markAsShipped(5)).resolves.toBe('shipped');
    expect(service.markAsShipped).toHaveBeenCalledWith(5);
  });
});