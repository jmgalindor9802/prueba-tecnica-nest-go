import { Controller, Get, Query } from '@nestjs/common';
import { OrdersService } from '../orders/orders.service';

@Controller('paypal')
export class PaymentsController {
  constructor(private readonly ordersService: OrdersService) {}

  @Get('success')
  async success(@Query('token') token: string) {
    if (token) {
      await this.ordersService.capturePaymentByTransactionId(token);
    }
    return { status: 'COMPLETED' };
  }

  @Get('cancel')
  cancel() {
    return { status: 'CANCELLED' };
  }
}