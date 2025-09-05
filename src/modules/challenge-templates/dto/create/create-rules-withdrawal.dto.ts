import { ApiProperty } from '@nestjs/swagger';
import { IsUUID, IsNotEmpty, IsString } from 'class-validator';

export class CreateRulesWithdrawalDto {
  @ApiProperty({
    description: 'ID de la regla asociada',
    example: '550e8400-e29b-41d4-a716-446655440000',
    format: 'uuid',
  })
  @IsUUID(4, { message: 'idRule debe ser un UUID válido' })
  @IsNotEmpty({ message: 'idRule es requerido' })
  idRule: string;

  @ApiProperty({
    description: 'ID de la relación de challenge asociada',
    example: '550e8400-e29b-41d4-a716-446655440001',
    format: 'uuid',
  })
  @IsUUID(4, { message: 'relationID debe ser un UUID válido' })
  @IsNotEmpty({ message: 'relationID es requerido' })
  relationID: string;

  @ApiProperty({
    description: 'Valor de la regla de retiro',
    example: 'Regla de retiro específica para este challenge',
    maxLength: 100,
  })
  @IsString({ message: 'value debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'value es requerido' })
  value: string;
}