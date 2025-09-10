import { Controller, Get, Query } from '@nestjs/common';
import { OrdersService } from '../orders/orders.service';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiTags('paypal')
@Controller('paypal')
export class PaymentsController {
    constructor(private readonly ordersService: OrdersService) { }

    @Get('success')
    @ApiOperation({
        summary: 'Retorno exitoso de PayPal',
        description:
            'PayPal redirige a este endpoint cuando el usuario aprueba el pago. Se captura la transacción y se devuelve el estado COMPLETED.',
    })
    async success(@Query('token') token: string) {
        if (token) {
            await this.ordersService.capturePaymentByTransactionId(token);
        }
        return { status: 'COMPLETED' };
    }

    @Get('cancel')
    @ApiOperation({
        summary: 'Cancelación desde PayPal',
        description:
            'PayPal redirige a este endpoint cuando el usuario cancela la operación. No se realiza ningún cargo y se devuelve el estado CANCELLED.',
    })
    cancel() {
        return { status: 'CANCELLED' };
    }
}