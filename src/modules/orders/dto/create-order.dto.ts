import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsNumber, IsUUID } from 'class-validator';

export class CreateOrderDto {
  @ApiProperty()
  @IsString()
  orderID: string;

  @ApiProperty()
  @IsString()
  statusOrder: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  idWoo?: number;

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
  documentChallenge?: string;
}