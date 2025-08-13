import { PartialType } from '@nestjs/swagger';
import { IsBoolean, IsOptional } from 'class-validator';
import { CreateApiKeyDto } from './create-api-key.dto';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateApiKeyDto extends PartialType(CreateApiKeyDto) {
  @ApiProperty({
    description: 'Estado activo/inactivo de la API key',
    example: true,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}