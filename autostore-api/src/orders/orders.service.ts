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

@Injectable()
export class OrdersService {
    constructor(
        @InjectRepository(Order)
        private readonly orderRepository: Repository<Order>,
        private readonly vehiclesService: VehiclesService,
        private readonly dataSource: DataSource,
        private readonly paymentsService: PaymentsService,
    ) { }

    async create(
        userId: number,
        vehicleIds: number[],
        shippingAddress: string,
        paymentMethod: string,
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

        let paymentTransactionId: string | undefined;
        let links: any[] | undefined;
        if (paymentMethod.toLowerCase() === 'paypal') {
            const result = await this.paymentsService.createOrder(total);
            paymentTransactionId = result.id;
            links = result.links;
        }

            return this.dataSource.transaction(async (manager) => {
                const order = manager.create(Order, {
                    user: { id: userId } as any,
                    vehicles,
                    total,
                    shippingAddress,
                    paymentMethod,
                    paymentTransactionId,
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
        }

    async findAll(userId: number, role: Role): Promise < Order[] > {
            if(role === Role.Admin) {
            return this.orderRepository.find({ relations: ['vehicles', 'user'] });
        }
        return this.orderRepository.find({
            where: { user: { id: userId } },
            relations: ['vehicles', 'user'],
        });
    }

    async findOne(id: number, userId: number, role: Role): Promise<Order> {
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

        return this.dataSource.transaction(async (manager) => {
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
  }

  private async updateStatus(id: number, status: OrderStatus): Promise<Order> {
    const order = await this.orderRepository.findOne({ where: { id } });
    if (!order) {
      throw new NotFoundException(`Orden con id ${id} no encontrada`);
    }
    order.status = status;
    return this.orderRepository.save(order);
  }

  markAsPaid(id: number): Promise<Order> {
    return this.updateStatus(id, OrderStatus.PAID);
  }

  markAsShipped(id: number): Promise<Order> {
    return this.updateStatus(id, OrderStatus.SHIPPED);
  }

  async capturePayment(id: number, userId: number, role: Role): Promise<Order> {
    const order = await this.findOne(id, userId, role);
    if (!order.paymentTransactionId) {
      throw new BadRequestException('Orden sin transacción de pago');
    }
    const completed = await this.paymentsService.captureOrder(
      order.paymentTransactionId,
    );
    if (!completed) {
      throw new BadRequestException('Pago no completado');
    }
      order.status = OrderStatus.PAID;
    return this.orderRepository.save(order);
  }
}