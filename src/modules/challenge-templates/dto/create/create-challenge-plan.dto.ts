import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  MaxLength,
  IsBoolean,
  IsOptional,
  IsNumber,
} from 'class-validator';

export class CreateChallengePlanDto {
  @ApiProperty({
    description: 'Name of the challenge plan',
    maxLength: 100,
  })
  @IsNotEmpty()
  @IsString()
  @MaxLength(100)
  name: string;

  @ApiProperty({
    description: 'Whether the plan is active',
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean = true;

  @ApiProperty({
    description: 'WooCommerce ID reference',
    required: false,
  })
  @IsOptional()
  @IsNumber()
  wooID?: number;
}
