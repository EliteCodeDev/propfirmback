import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsNumber, IsUUID } from 'class-validator';
import { OrderStatus } from 'src/common/enums/order-status.enum';
import { wooOrderProduct, wooUserData } from '../types';
export class CreateCompleteOrderDto {
  @ApiProperty()
  user: wooUserData;

  @ApiProperty()
  @IsString()
  status: OrderStatus;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  wooID?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  total?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  product: wooOrderProduct;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  createDateTime?: Date;

  coupon?
}
