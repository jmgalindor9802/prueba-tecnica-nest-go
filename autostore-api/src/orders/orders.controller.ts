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
} from '@nestjs/swagger';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
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
    @ApiOperation({ summary: 'Crear una orden' })
    @ApiCreatedResponse({ description: 'Orden creada' })
    @ApiBody({ type: CreateOrderDto })
    async create(@Req() req: any, @Body() dto: CreateOrderDto) {
        return this.ordersService.create(
            req.user.id,
            dto.vehicleIds,
            dto.shippingAddress,
            dto.paymentMethod,
            dto.notes,
        );
    }

    @Get()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.Admin, Role.Client)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Listar órdenes' })
    async findAll(@Req() req: any) {
        return this.ordersService.findAll(req.user.id, req.user.role);
    }

    @Get(':id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.Admin, Role.Client)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Obtener detalles de una orden' })
    async findOne(@Req() req: any, @Param('id', ParseIntPipe) id: number) {
        return this.ordersService.findOne(id, req.user.id, req.user.role);
    }

    @Patch(':id/cancel')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.Admin, Role.Client)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Cancelar una orden' })
    async cancel(
        @Req() req: any,
        @Param('id', ParseIntPipe) id: number,
        @Body() dto: CancelOrderDto,
    ) {
        return this.ordersService.cancel(id, req.user.id, req.user.role, dto.reason);
    }

    @Patch(':id/pay')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.Admin)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Marcar orden como pagada' })
    async markAsPaid(@Param('id', ParseIntPipe) id: number) {
        return this.ordersService.markAsPaid(id);
    }

    @Patch(':id/ship')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.Admin)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Marcar orden como enviada' })
    async markAsShipped(@Param('id', ParseIntPipe) id: number) {
        return this.ordersService.markAsShipped(id);
    }
}