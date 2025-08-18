import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsNumber, IsUUID } from 'class-validator';
import { OrderStatus } from 'src/common/enums/order-status.enum';
export class CreateOrderDto {
  @ApiProperty()
  @IsString()
  userID: string;

  @ApiProperty()
  @IsString()
  statusOrder: OrderStatus;

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
  @IsString()
  products?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  orderKey?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsUUID()
  challengeID?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  createDateTime?: Date;
}
