import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional } from 'class-validator';

export class UpdateRulesWithdrawalDto {
  @ApiProperty({
    description: 'Valor de la regla de retiro',
    example: 'Regla de retiro actualizada',
    maxLength: 100,
    required: false,
  })
  @IsString({ message: 'value debe ser una cadena de texto' })
  @IsOptional()
  value?: string;
}