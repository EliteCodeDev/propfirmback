import { IsString, IsNotEmpty, IsNumber, IsEmail, IsPositive } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateAccountDto {
  @ApiProperty({
    description: 'Nombre del usuario',
    example: 'daniel'
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description: 'Nombre del grupo',
    example: 'contest\\PG\\kbst\\contestphase1'
  })
  @IsString()
  @IsNotEmpty()
  groupName: string;

  @ApiProperty({
    description: 'Correo electrónico del usuario',
    example: 'dani@gmail.com'
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    description: 'Número de teléfono',
    example: '+51959543569'
  })
  @IsString()
  @IsNotEmpty()
  phone: string;

  @ApiProperty({
    description: 'País del usuario',
    example: 'peru'
  })
  @IsString()
  @IsNotEmpty()
  country: string;

  @ApiProperty({
    description: 'Ciudad del usuario',
    example: 'lima'
  })
  @IsString()
  @IsNotEmpty()
  city: string;

  @ApiProperty({
    description: 'Dirección del usuario',
    example: 'av los angeles'
  })
  @IsString()
  @IsNotEmpty()
  address: string;

  @ApiProperty({
    description: 'Balance inicial de la cuenta',
    example: 10000
  })
  @IsNumber()
  @IsPositive()
  balance: number;

  @ApiProperty({
    description: 'Contraseña maestra',
    example: '123Test*'
  })
  @IsString()
  @IsNotEmpty()
  mPassword: string;

  @ApiProperty({
    description: 'Contraseña de inversión',
    example: '123Test*aas'
  })
  @IsString()
  @IsNotEmpty()
  iPassword: string;

  @ApiProperty({
    description: 'Apalancamiento de la cuenta',
    example: 100
  })
  @IsNumber()
  @IsPositive()
  leverage: number;
}
