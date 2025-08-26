import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString, IsNotEmpty } from 'class-validator';

export class ListClosedPositionsDto {
  @ApiProperty({ description: 'Login del usuario', example: 123456 })
  @IsNumber()
  login: number;

  @ApiProperty({
    description: 'Fecha inicial (YYYY-MM-DD)',
    example: '2025-08-01',
  })
  @IsString()
  @IsNotEmpty()
  start_time: string; // YYYY-MM-DD

  @ApiProperty({
    description: 'Fecha final (YYYY-MM-DD)',
    example: '2025-08-25',
  })
  @IsString()
  @IsNotEmpty()
  end_time: string; // YYYY-MM-DD

  @ApiProperty({
    description: 'Offset para paginación',
    example: 0,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  offset?: number;
}
