import {
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsString,
  Length,
  IsEnum,
  IsOptional,
} from 'class-validator';

export class CreateAddonsDto {
  @IsString({
    message: 'Addon name is required',
  })
  @IsNotEmpty()
  @Length(1, 100)
  name: string;

  @IsOptional()
  @IsString()
  @Length(1, 100)
  slugRule?: string;

  @IsOptional()
  @IsEnum(['number', 'boolean', 'percentage'], {
    message: 'Value type must be number, boolean, or percentage',
  })
  valueType?: 'number' | 'boolean' | 'percentage';

  @IsBoolean()
  isActive: boolean;

  @IsBoolean()
  hasDiscount: boolean;

  @IsNumber()
  discount: number;
}
