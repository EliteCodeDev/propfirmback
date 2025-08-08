import { PartialType, OmitType } from '@nestjs/swagger';
import { CreateOrderDto } from '../create/create-order.dto';

export class UpdateOrderDto extends PartialType(
  OmitType(CreateOrderDto, ['orderID'] as const),
) {}
