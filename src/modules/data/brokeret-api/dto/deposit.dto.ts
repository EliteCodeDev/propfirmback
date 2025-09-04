import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
} from 'class-validator';

export class DepositDto {
  @ApiProperty({
    description: 'ID de la cuenta a depositar',
    example: 123456,
  })
  @IsNumber()
  @IsPositive()
  loginid: number;

  @ApiProperty({
    description: 'Monto a depositar',
    example: 1000,
  })
  @IsNumber()
  @IsPositive()
  amount: number;

  @ApiProperty({
    description: 'Tipo de transacción',
    example: 0,
  })
  @IsNumber()
  @IsPositive()
  @IsOptional()
  txnType?: number = 0;

  @ApiProperty({
    description: 'Descripción de la transacción',
    example: 'depósito',
  })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({
    description: 'Comentario de la transacción',
    example: 'depósito',
  })
  @IsString()
  @IsNotEmpty()
  comment: string;
}
// {
//   "loginid": 0,
//   "amount": 0,
//   "txnType": 0,
//   "description": "string",
//   "comment": "string"
// }
