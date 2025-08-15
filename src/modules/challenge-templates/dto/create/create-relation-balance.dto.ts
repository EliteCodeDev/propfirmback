import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsBoolean,
  IsOptional,
  IsNumber,
  IsUUID,
} from 'class-validator';

export class CreateRelationBalanceDto {
  @ApiProperty({
    description: 'Balance ID reference',
    format: 'uuid',
  })
  @IsNotEmpty()
  @IsString()
  @IsUUID()
  balanceID: string;

  @ApiProperty({
    description: 'Relation ID reference',
    format: 'uuid',
  })
  @IsNotEmpty()
  @IsString()
  @IsUUID()
  relationID: string;

  @ApiProperty({
    description: 'Price for this relation balance',
    required: true,
  })
  @IsNumber()
  price: number;

  @ApiProperty({
    description: 'Whether the relation balance is active',
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean = true;

  @ApiProperty({
    description: 'Whether the relation balance has discount',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  hasDiscount?: boolean = false;

  @ApiProperty({
    description: 'Discount amount',
    required: false,
  })
  @IsOptional()
  @IsNumber()
  discount?: number;
}
export class BalanceForRelationDto {
  @ApiProperty({
    description: 'Challenge Balance ID',
  })
  @IsNotEmpty()
  @IsString()
  @IsUUID()
  challengeBalanceID: string;
  @ApiProperty({
    description: 'Price for this relation balance',
  })
  @IsNotEmpty()
  @IsNumber()
  price: number;

  @ApiProperty({
    description: 'Whether the relation balance is active',
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean = true;

  @ApiProperty({
    description: 'Whether the relation balance has discount',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  hasDiscount?: boolean = false;

  @ApiProperty({
    description: 'Discount amount',
    required: false,
  })
  @IsOptional()
  @IsNumber()
  discount?: number;
}
export class CreateRelationBalancesDto {
  @ApiProperty({
    description: 'Challenge Relation ID',
  })
  @IsNotEmpty()
  @IsString()
  @IsUUID()
  challengeRelationID: string;

  @ApiProperty({
    type: [CreateRelationBalanceDto],
    description: 'Array of relation balances to create',
  })
  @IsNotEmpty()
  relationBalances: BalanceForRelationDto[];
}
