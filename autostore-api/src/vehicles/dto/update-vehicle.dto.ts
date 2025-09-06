import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsInt,
  Min,
  IsNumber,
  IsPositive,
  Length,
   IsBoolean,
} from 'class-validator';

export class UpdateVehicleDto {
  @ApiPropertyOptional({ example: 'Toyota', description: 'Marca del vehículo' })
  @IsOptional()
  @IsString()
  brand?: string;

  @ApiPropertyOptional({
    example: 'Corolla',
    description: 'Modelo del vehículo',
  })
  @IsOptional()
  @IsString()
  model?: string;

  @ApiPropertyOptional({ example: 2024, description: 'Año del vehículo' })
  @IsOptional()
  @IsInt()
  @Min(1886)
  year?: number;

  @ApiPropertyOptional({ example: 15000.5, description: 'Precio del vehículo' })
  @IsOptional()
  @IsNumber()
  @IsPositive()
  price?: number;

  @ApiPropertyOptional({
    example: '1HGCM82633A004352',
    description: 'Número VIN único del vehículo',
  })
  @IsOptional()
  @IsString()
  @Length(17, 17)
  vin?: string;

  @ApiPropertyOptional({
    description: 'Descripción del vehículo',
    example: 'Auto en perfecto estado',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    example: true,
    description: 'Disponibilidad del vehículo',
  })
  @IsOptional()
   @IsBoolean()
  isAvailable?: boolean;
}