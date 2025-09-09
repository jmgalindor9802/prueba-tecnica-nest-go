import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order, OrderStatus } from './entities/order.entity';
import { VehiclesService } from '../vehicles/vehicles.service';

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    private readonly vehiclesService: VehiclesService,
  ) {}

  async create(userId: number, vehicleIds: number[]): Promise<Order> {
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

    const order = this.orderRepository.create({
      user: { id: userId } as any,
      vehicles,
      total,
      status: OrderStatus.PENDING,
    });
    const saved = await this.orderRepository.save(order);

    await Promise.all(
      vehicles.map((v) => this.vehiclesService.markAsUnavailable(v.id)),
    );

    return saved;
  }

  async updateStatus(id: number, status: OrderStatus): Promise<Order> {
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
}