import {
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
  registerDecorator,
  ValidationOptions,
} from 'class-validator';

@ValidatorConstraint({ name: 'isAddonValue', async: false })
export class IsAddonValueConstraint implements ValidatorConstraintInterface {
  validate(value: any, args: ValidationArguments) {
    return (
      value === null ||
      value === undefined ||
      typeof value === 'number' ||
      typeof value === 'boolean'
    );
  }

  defaultMessage(args: ValidationArguments) {
    return 'Value must be a number, boolean, or null';
  }
}

export function IsAddonValue(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsAddonValueConstraint,
    });
  };
}

export class CreateChallegeAddonDto {
  @IsString()
  @IsUUID('4', { message: 'Addon ID must be a valid UUID' })
  @IsNotEmpty({ message: 'Relation ID is required' })
  addonID: string;

  @IsString()
  @IsUUID('4', { message: 'Addon ID must be a valid UUID' })
  @IsNotEmpty({ message: 'Relation ID is required' })
  challengeID: string;

  @IsBoolean()
  @IsOptional()
  isActive: boolean;

  @IsBoolean()
  @IsOptional()
  hasDiscount: boolean;

  @IsNumber()
  @IsOptional()
  discount: number;

  @IsNumber()
  @IsOptional()
  wooID: number;

  /**
   * Value for the addon modification
   * @example 10 // For numeric values (percentages, amounts)
   * @example true // For boolean flags
   * @example 0.15 // For percentage values (15%)
   */
  @IsAddonValue()
  @IsOptional()
  value?: number | boolean;
}
