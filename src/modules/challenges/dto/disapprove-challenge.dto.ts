import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, MaxLength } from 'class-validator';

export class DisapproveChallengeDto {
  @ApiProperty({
    description: 'Observación o razón por la cual el challenge fue desaprobado',
    example: 'El challenge no cumple con las reglas de riesgo establecidas',
    required: false,
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500, {
    message: 'La observación no puede exceder los 500 caracteres',
  })
  observation?: string;
}