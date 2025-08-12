import { IsString, IsOptional, IsDateString, MinLength, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateApiKeyDto {
  @ApiProperty({
    description: 'Nombre identificativo de la API key',
    example: 'Integration Partner XYZ',
  })
  @IsString()
  @MinLength(3)
  @MaxLength(100)
  name: string;

  @ApiProperty({
    description: 'Descripción opcional de la API key',
    example: 'API key para integración con sistema de terceros',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @ApiProperty({
    description: 'Fecha de expiración opcional (ISO string)',
    example: '2024-12-31T23:59:59.000Z',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  expiresAt?: string;
}