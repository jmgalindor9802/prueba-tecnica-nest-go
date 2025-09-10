import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Order, OrderStatus } from './entities/order.entity';
import { VehiclesService } from '../vehicles/vehicles.service';
import { Role } from '../users/entities/role.enum';
import { PaymentsService } from '../payments/payments.service';
import { RedisService } from '../redis/redis.service';

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    private readonly vehiclesService: VehiclesService,
    private readonly dataSource: DataSource,
    private readonly paymentsService: PaymentsService,
    private readonly redisService: RedisService,
  ) {}

  async create(
    userId: number,
    vehicleIds: number[],
    shippingAddress: string,
    notes?: string,
  ): Promise<Order & { links?: any[] }> {
    if (new Set(vehicleIds).size !== vehicleIds.length) {
      throw new BadRequestException('IDs de vehículos duplicados');
    }

    const vehicles = await Promise.all(
      vehicleIds.map((id) => this.vehiclesService.findOne(id)),
    );

    const unavailable = vehicles.find((v) => !v.isAvailable);
    if (unavailable) {
      throw new BadRequestException(
        `Vehículo con id ${unavailable.id} no disponible`,
      );
    }

    const total = vehicles.reduce((sum, v) => sum + v.price, 0);
    const result = await this.paymentsService.createOrder(total);
    const paymentTransactionId = result.id;
    const links = result.links;
    const paymentLink = result.links?.find(
      (l: any) => l.rel === 'approve',
    )?.href;

    const created = await this.dataSource.transaction(async (manager) => {
      const order = manager.create(Order, {
        user: { id: userId } as any,
        vehicles,
        total,
        shippingAddress,
        paymentMethod: 'paypal',
        paymentTransactionId,
        paymentLink,
        notes,
        status: OrderStatus.PENDING,
      });
      const saved = await manager.save(order);

      await Promise.all(
        vehicles.map((v) =>
          this.vehiclesService.markAsUnavailable(v.id, manager),
        ),
      );

      return { ...saved, links };
    });

    await this.redisService.set(`order:${created.id}`, created);
    return created;
  }

  async findAll(
    userId: number,
    role: Role,
  ): Promise<(Order & { links?: any[] })[]> {
    const orders =
      role === Role.Admin
        ? await this.orderRepository.find({
            relations: ['vehicles', 'user'],
          })
        : await this.orderRepository.find({
            where: { user: { id: userId } },
            relations: ['vehicles', 'user'],
          });

    return orders.map((o) => this.appendLinks(o));
  }

  async findOne(
    id: number,
    userId: number,
    role: Role,
  ): Promise<Order & { links?: any[] }> {
    const cacheKey = `order:${id}`;
    const cached = await this.redisService.get<Order & { links?: any[] }>(
      cacheKey,
    );
    if (cached) {
      if (role !== Role.Admin && cached.user.id !== userId) {
        throw new ForbiddenException('Acceso denegado');
      }
      return cached;
    }

    const order = await this.orderRepository.findOne({
      where: { id },
      relations: ['vehicles', 'user'],
    });
    if (!order) {
      throw new NotFoundException(`Orden con id ${id} no encontrada`);
    }
    if (role !== Role.Admin && order.user.id !== userId) {
      throw new ForbiddenException('Acceso denegado');
    }

    const formatted = this.appendLinks(order);
    await this.redisService.set(cacheKey, formatted);
    return formatted;
  }

  private appendLinks(order: Order): Order & { links?: any[] } {
    if (order.status === OrderStatus.PENDING && order.paymentLink) {
      (order as any).links = [
        { href: order.paymentLink, rel: 'approve', method: 'GET' },
      ];
    } else {
      delete (order as any).paymentLink;
    }
    return order;
  }

  async cancel(
    id: number,
    userId: number,
    role: Role,
    reason?: string,
  ): Promise<Order> {
    const order = await this.findOne(id, userId, role);
    if (order.status === OrderStatus.CANCELLED) {
      throw new BadRequestException('La orden ya está cancelada');
    }
    if (order.status !== OrderStatus.PENDING) {
      throw new BadRequestException(
        'Solo se pueden cancelar órdenes pendientes',
      );
    }

    const updated = await this.dataSource.transaction(async (manager) => {
      order.status = OrderStatus.CANCELLED;
      order.cancellationReason = reason;
      const saved = await manager.save(order);
      await Promise.all(
        order.vehicles.map((v) =>
          this.vehiclesService.markAsAvailable(v.id, manager),
        ),
      );
      return saved;
    });

    await this.redisService.del(`order:${id}`);
    return updated;
  }

  private async updateStatus(id: number, status: OrderStatus): Promise<Order> {
    const order = await this.orderRepository.findOne({ where: { id } });
    if (!order) {
      throw new NotFoundException(`Orden con id ${id} no encontrada`);
    }
    order.status = status;
    const saved = await this.orderRepository.save(order);
    await this.redisService.del(`order:${id}`);
    return saved;
  }

  markAsShipped(id: number): Promise<Order> {
    return this.updateStatus(id, OrderStatus.SHIPPED);
  }

  async capturePaymentByTransactionId(token: string): Promise<Order> {
    const order = await this.orderRepository.findOne({
      where: { paymentTransactionId: token },
    });
    if (!order) {
      throw new NotFoundException(
        `Orden con transacción ${token} no encontrada`,
      );
    }
    const completed = await this.paymentsService.captureOrder(token);
    if (!completed) {
      throw new BadRequestException('Pago no completado');
    }

    order.status = OrderStatus.PAID;
    const saved = await this.orderRepository.save(order);
    await this.redisService.del(`order:${order.id}`);
    return saved;
  }
}
