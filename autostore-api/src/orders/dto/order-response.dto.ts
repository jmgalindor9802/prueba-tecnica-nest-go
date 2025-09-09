import { ApiProperty } from '@nestjs/swagger';
import { Order } from '../entities/order.entity';

class PayPalLinkDto {
  @ApiProperty()
  href: string;

  @ApiProperty()
  rel: string;

  @ApiProperty()
  method: string;
}

export class OrderResponseDto extends Order {
  @ApiProperty({
    type: [PayPalLinkDto],
    required: false,
    description:
      'Enlaces devueltos por PayPal para completar el flujo de pago',
  })
  links?: PayPalLinkDto[];
}
