import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsInt,
  Min,
  IsNumber,
  IsPositive,
  Length,
  IsOptional,
    IsBoolean,
} from 'class-validator';

export class CreateVehicleDto {
  @ApiProperty({ example: 'Toyota', description: 'Marca del vehículo' })
  @IsString()
  @IsNotEmpty()
  brand: string;

  @ApiProperty({ example: 'Corolla', description: 'Modelo del vehículo' })
  @IsString()
  @IsNotEmpty()
  model: string;

  @ApiProperty({ example: 2024, description: 'Año del vehículo' })
  @IsInt()
  @Min(1886)
  year: number;

  @ApiProperty({ example: 150000000.5, description: 'Precio del vehículo' })
  @IsNumber()
  @IsPositive()
  price: number;

  @ApiProperty({
    example: '1HGCM82633A004352',
    description: 'Número VIN único del vehículo',
  })
  @IsString()
  @Length(17, 17)
  vin: string;

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