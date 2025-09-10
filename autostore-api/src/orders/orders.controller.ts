import {
    Controller,
    Post,
    Body,
    UseGuards,
    Req,
    Patch,
    Param,
    ParseIntPipe,
    Get,
} from '@nestjs/common';
import {
    ApiTags,
    ApiBearerAuth,
    ApiOperation,
    ApiCreatedResponse,
    ApiBody,
    ApiOkResponse,
    ApiNotFoundResponse,
} from '@nestjs/swagger';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { OrderResponseDto } from './dto/order-response.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { Role } from '../users/entities/role.enum';
import { CancelOrderDto } from './dto/cancel-order.dto';

@ApiTags('orders')
@Controller('orders')
export class OrdersController {
    constructor(private readonly ordersService: OrdersService) { }

    @Post()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.Admin, Role.Client)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Crear una orden de compra (pago con PayPal)' })
    @ApiCreatedResponse({ description: 'Orden creada' })
    @ApiBody({
        type: CreateOrderDto,
        examples: {
            ejemplo: {
                summary: 'Pedido usando PayPal',
                value: {
                    vehicleIds: [1],
                    shippingAddress: 'Calle Falsa 123',
                    notes: 'Entregar por la mañana',
                },
            },
        },
    })
    async create(@Req() req: any, @Body() dto: CreateOrderDto) {
        return this.ordersService.create(
            req.user.id,
            dto.vehicleIds,
            dto.shippingAddress,
            dto.notes,
        );
    }

    @Get()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.Admin, Role.Client)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Listar órdenes' })
    @ApiOkResponse({
        description: 'Lista de órdenes',
        type: OrderResponseDto,
        isArray: true,
    })
    async findAll(@Req() req: any) {
        return this.ordersService.findAll(req.user.id, req.user.role);
    }

    @Get(':id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.Admin, Role.Client)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Obtener detalles de una orden' })
    @ApiOkResponse({
        description: 'Detalles de la orden',
        type: OrderResponseDto,
    })
    @ApiNotFoundResponse({ description: 'Orden no encontrada' })
    async findOne(@Req() req: any, @Param('id', ParseIntPipe) id: number) {
        return this.ordersService.findOne(id, req.user.id, req.user.role);
    }

    @Patch(':id/cancel')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.Admin, Role.Client)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Cancelar una orden' })
    @ApiOkResponse({ description: 'Orden cancelada', type: OrderResponseDto })
    @ApiNotFoundResponse({ description: 'Orden no encontrada' })
    async cancel(
        @Req() req: any,
        @Param('id', ParseIntPipe) id: number,
        @Body() dto: CancelOrderDto,
    ) {
        return this.ordersService.cancel(
            id,
            req.user.id,
            req.user.role,
            dto.reason,
        );
    }

    @Patch(':id/ship')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.Admin)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Marcar orden como enviada' })
    @ApiOkResponse({ description: 'Orden actualizada', type: OrderResponseDto })
    @ApiNotFoundResponse({ description: 'Orden no encontrada' })
    async markAsShipped(@Param('id', ParseIntPipe) id: number) {
        return this.ordersService.markAsShipped(id);
    }
}