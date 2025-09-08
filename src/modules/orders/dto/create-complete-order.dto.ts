import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsNumber,
  IsUUID,
  ValidateNested,
  IsObject,
  IS_EMAIL,
  isEmail,
  IsEmail,
} from 'class-validator';
import { Type } from 'class-transformer';
import { OrderStatus } from 'src/common/enums/order-status.enum';
import { wooOrderProduct, wooUserData } from '../types';

class BillingDto {
  @ApiProperty()
  @IsString()
  first_name: string;

  @ApiProperty()
  @IsString()
  last_name: string;

  @ApiProperty()
  @IsString()
  address_1: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  address_2?: string;

  @ApiProperty()
  @IsString()
  city: string;

  @ApiProperty()
  @IsString()
  state: string;

  @ApiProperty()
  @IsString()
  postcode: string;

  @ApiProperty()
  @IsString()
  country: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  phone?: string;
}

class UserDataDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  wooId?: number;

  @ApiProperty()
  @IsString()
  @IsEmail()
  email: string;

  @ApiProperty()
  @IsString()
  name: string;

  @ApiProperty()
  @ValidateNested()
  @Type(() => BillingDto)
  billing: BillingDto;
}

class ProductDto {
  @ApiProperty()
  @IsNumber()
  productID: number;

  @ApiProperty()
  @IsNumber()
  variationID: number;

  @ApiProperty()
  @IsString()
  name: string;

  @ApiProperty()
  @IsNumber()
  price: number;
}
class AddonDto {
  @ApiProperty()
  @IsNumber()
  productID: number;

  @ApiProperty()
  @IsNumber()
  variationID?: number;

  @ApiProperty()
  @IsString()
  name: string;

  @ApiProperty()
  @IsNumber()
  price?: number;
}
export class CreateCompleteOrderDto {
  @ApiProperty()
  @ValidateNested()
  @Type(() => UserDataDto)
  user: UserDataDto;

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
  @ValidateNested()
  @Type(() => ProductDto)
  product?: ProductDto;

  addons?: AddonDto[];

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  createDateTime?: Date;

  @ApiProperty({ required: false })
  @IsOptional()
  coupon?: any;
}
