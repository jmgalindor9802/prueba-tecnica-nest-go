import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class CancelOrderDto {
  @ApiPropertyOptional({ description: 'Motivo de la cancelación' })
  @IsOptional()
  @IsString()
  reason?: string;
}