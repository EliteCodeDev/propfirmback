import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AuthDto {
  @ApiProperty({
    description: 'Nombre de usuario para autenticación',
    example: 'backofficeApi'
  })
  @IsString()
  @IsNotEmpty()
  userName: string;

  @ApiProperty({
    description: 'Contraseña para autenticación',
    example: 'Trade@2022'
  })
  @IsString()
  @IsNotEmpty()
  password: string;
}