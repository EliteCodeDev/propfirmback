import { ApiProperty } from '@nestjs/swagger';
import {
  IsUUID,
  IsNotEmpty,
  IsNumber,
  IsBoolean,
  IsOptional,
  Min,
  ValidateIf,
  ValidationArguments,
  registerDecorator,
  ValidationOptions,
} from 'class-validator';

/**
 * Decorador personalizado para validar valores de addon
 */
function IsAddonValue(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'isAddonValue',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          // Si el valor es null o undefined, es válido (campo opcional)
          if (value === null || value === undefined) {
            return true;
          }
          
          // Validar que sea number o boolean
          return typeof value === 'number' || typeof value === 'boolean';
        },
        defaultMessage(args: ValidationArguments) {
          return 'Value must be a number or boolean';
        },
      },
    });
  };
}

export class CreateRelationAddonDto {
  @ApiProperty({
    description: 'ID of the addon to be related',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsNotEmpty({ message: 'Addon ID is required' })
  @IsUUID('4', { message: 'Addon ID must be a valid UUID' })
  addonID: string;

  @ApiProperty({
    description: 'ID of the challenge relation',
    example: '550e8400-e29b-41d4-a716-446655440001',
  })
  @IsNotEmpty({ message: 'Relation ID is required' })
  @IsUUID('4', { message: 'Relation ID must be a valid UUID' })
  relationID: string;

  @ApiProperty({
    description: 'Rule modification value for the addon (numeric value, percentage, or boolean flag)',
    examples: {
      numeric: { value: 2.5, description: 'Numeric value for calculations' },
      boolean: { value: true, description: 'Boolean flag for enable/disable features' },
      percentage: { value: 15, description: 'Percentage value (e.g., 15 for 15%)' }
    },
    required: false,
  })
  @IsOptional()
  @IsAddonValue()
  value?: number | boolean;

  @ApiProperty({
    description: 'Whether the addon is active for this relation',
    example: true,
    default: true,
  })
  @IsOptional()
  @IsBoolean({ message: 'isActive must be a boolean value' })
  isActive?: boolean;

  @ApiProperty({
    description: 'Whether the addon has a discount for this relation',
    example: false,
    default: false,
  })
  @IsOptional()
  @IsBoolean({ message: 'hasDiscount must be a boolean value' })
  hasDiscount?: boolean;

  @ApiProperty({
    description: 'Discount amount for the addon',
    example: 10.0,
    required: false,
  })
  @IsOptional()
  @IsNumber({}, { message: 'Discount must be a valid number' })
  @Min(0, { message: 'Discount must be greater than or equal to 0' })
  discount?: number;

  @ApiProperty({
    description: 'WooCommerce ID for integration',
    example: 12345,
    required: false,
  })
  @IsOptional()
  @IsNumber({}, { message: 'WooID must be a valid number' })
  wooID?: number;
}
