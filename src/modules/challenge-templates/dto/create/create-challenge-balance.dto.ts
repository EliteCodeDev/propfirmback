import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  MaxLength,
  IsBoolean,
  IsOptional,
  IsNumber,
  IsDecimal,
} from 'class-validator';

export class CreateChallengeBalanceDto {
  @ApiProperty({
    description: 'Name of the challenge balance',
    maxLength: 100,
  })
  @IsNotEmpty()
  @IsString()
  @MaxLength(100)
  name: string;

  @ApiProperty({
    description: 'Whether the balance is active',
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean = true;

  @ApiProperty({
    description: 'Whether the balance has discount',
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

  @ApiProperty({
    description: 'Balance amount',
    required: false,
  })
  @IsOptional()
  @IsNumber()
  balance?: number;
}
