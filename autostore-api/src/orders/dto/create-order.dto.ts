import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayNotEmpty,
  IsArray,
  IsInt,
  IsString,
  IsOptional,
  MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateOrderDto {
  @ApiProperty({
    type: [Number],
    description: 'IDs de vehículos en el carrito',
  })
  @IsArray()
  @ArrayNotEmpty()
  @Type(() => Number)
  @IsInt({ each: true })
  vehicleIds: number[];
  
  @ApiProperty({ description: 'Dirección de envío' })
  @IsString()
  @MaxLength(255)
  shippingAddress: string;

  @ApiProperty({ description: 'Método de pago' })
  @IsString()
  @MaxLength(100)
  paymentMethod: string;

  @ApiPropertyOptional({ description: 'Notas adicionales' })
  @IsOptional()
  @IsString()
  notes?: string;
}