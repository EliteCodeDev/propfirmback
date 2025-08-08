import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsUUID,
  IsBoolean,
  IsOptional,
  MaxLength,
} from 'class-validator';

export class CreateStageParameterDto {
  @ApiProperty({
    description: 'Rule ID reference',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  ruleID: string;

  @ApiProperty({
    description: 'Relation Stage ID reference',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  relationStageID: string;

  @ApiProperty({
    description: 'Value for the rule parameter',
    example: '5000',
  })
  @IsString()
  @MaxLength(255)
  ruleValue: string;

  @ApiProperty({
    description: 'Whether the parameter is active',
    example: true,
    default: true,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
