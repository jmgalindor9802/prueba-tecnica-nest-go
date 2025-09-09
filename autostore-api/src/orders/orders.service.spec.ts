import { Repository } from 'typeorm';
import { OrdersService } from './orders.service';
import { Order, OrderStatus } from './entities/order.entity';
import { VehiclesService } from '../vehicles/vehicles.service';
import { Role } from '../users/entities/role.enum';

class MockManager {
    save = jest.fn();
    create = jest.fn();
}

describe('OrdersService', () => {
    let service: OrdersService;
    let orderRepo: jest.Mocked<Repository<Order>>;
    let vehiclesService: jest.Mocked<VehiclesService>;
    let dataSource: { transaction: jest.Mock };
    let manager: MockManager;
    let paymentsService: { createOrder: jest.Mock; captureOrder: jest.Mock };

    beforeEach(() => {
        orderRepo = {
            find: jest.fn(),
            findOne: jest.fn(),
        } as unknown as jest.Mocked<Repository<Order>>;

        vehiclesService = {
            findOne: jest.fn(),
            markAsUnavailable: jest.fn(),
            markAsAvailable: jest.fn(),
        } as unknown as jest.Mocked<VehiclesService>;

        manager = new MockManager();
        dataSource = {
            transaction: jest.fn(async (cb) => cb(manager)),
        };
        paymentsService = {
            createOrder: jest.fn().mockResolvedValue({
                id: 'paypal123',
                links: [{ href: 'http://paypal', rel: 'approve', method: 'GET' }],
            }),
            captureOrder: jest.fn().mockResolvedValue(true),
        };

        service = new OrdersService(
            orderRepo as any,
            vehiclesService as any,
            dataSource as any,
            paymentsService as any,
        );
    });

    it('should create order and mark vehicles unavailable', async () => {
        const vehicle = { id: 1, price: 100, isAvailable: true } as any;
        vehiclesService.findOne.mockResolvedValue(vehicle);
        manager.create.mockImplementation((_, obj) => obj as Order);
        manager.save.mockImplementation(async (o) => o as Order);

        const order = await service.create(1, [1], 'dir', 'paypal');

        expect(order.total).toBe(100);
        expect(order.links).toEqual([
            { href: 'http://paypal', rel: 'approve', method: 'GET' },
        ]);
        expect(order.paymentLink).toBe('http://paypal');
        expect(vehiclesService.markAsUnavailable).toHaveBeenCalledWith(1, manager);
        expect(paymentsService.createOrder).toHaveBeenCalledWith(100);
    });

    it('should throw when vehicle ids duplicated', async () => {
        await expect(service.create(1, [1, 1], 'a', 'b')).rejects.toBeInstanceOf(
            Error,
        );
    });

    it('should cancel order and mark vehicles available', async () => {
        const order = {
            id: 1,
            status: OrderStatus.PENDING,
            user: { id: 1 },
            vehicles: [{ id: 2 }],
        } as any;
        orderRepo.findOne.mockResolvedValue(order);
        manager.save.mockImplementation(async (o) => o as Order);

        const result = await service.cancel(1, 1, Role.Client, 'motivo');
        expect(result.status).toBe(OrderStatus.CANCELLED);
        expect(vehiclesService.markAsAvailable).toHaveBeenCalledWith(2, manager);
    });

    it('should update status to shipped', async () => {
        orderRepo.findOne.mockResolvedValue({
            id: 1,
            status: OrderStatus.PENDING,
        } as Order);
        orderRepo.save = jest.fn(async (o: any) => o) as unknown as any;

        const order = await service.markAsShipped(1);
        expect(order.status).toBe(OrderStatus.SHIPPED);
    });

    it('should capture payment and mark as paid', async () => {
        const order = {
            id: 1,
            status: OrderStatus.PENDING,
            user: { id: 1 },
            paymentTransactionId: 'paypal123',
        } as any;
        orderRepo.findOne.mockResolvedValue(order);
        orderRepo.save = jest.fn(async (o: any) => o) as any;

        const result = await service.capturePayment(1, 1, Role.Client);
        expect(result.status).toBe(OrderStatus.PAID);
        expect(paymentsService.captureOrder).toHaveBeenCalledWith('paypal123');
    });

      it('debería incluir el link de pago en findAll para órdenes pendientes', async () => {
        const order = {
            id: 1,
            status: OrderStatus.PENDING,
            paymentLink: 'http://paypal',
            user: { id: 1 },
            vehicles: [],
        } as any;
        orderRepo.find.mockResolvedValue([order]);
        const result = await service.findAll(1, Role.Admin);
        expect(result[0].links).toEqual([
            { href: 'http://paypal', rel: 'approve', method: 'GET' },
        ]);
    });

    it('debería incluir el link de pago en findOne para orden pendiente', async () => {
        const order = {
            id: 1,
            status: OrderStatus.PENDING,
            paymentLink: 'http://paypal',
            user: { id: 1 },
            vehicles: [],
        } as any;
        orderRepo.findOne.mockResolvedValue(order);
        const result = await service.findOne(1, 1, Role.Client);
        expect(result.links).toEqual([
            { href: 'http://paypal', rel: 'approve', method: 'GET' },
        ]);
    });

    it('no debería incluir el link de pago en findAll para órdenes no pendientes', async () => {
        const order = {
            id: 2,
            status: OrderStatus.PAID,
            paymentLink: 'http://paypal',
            user: { id: 1 },
            vehicles: [],
        } as any;
        orderRepo.find.mockResolvedValue([order]);
        const result = await service.findAll(1, Role.Admin);
        expect(result[0].links).toBeUndefined();
        expect(result[0].paymentLink).toBeUndefined();
    });

    it('no debería incluir el link de pago en findOne para orden no pendiente', async () => {
        const order = {
            id: 3,
            status: OrderStatus.PAID,
            paymentLink: 'http://paypal',
            user: { id: 1 },
            vehicles: [],
        } as any;
        orderRepo.findOne.mockResolvedValue(order);
        const result = await service.findOne(3, 1, Role.Admin);
        expect(result.links).toBeUndefined();
        expect(result.paymentLink).toBeUndefined();
    });
});