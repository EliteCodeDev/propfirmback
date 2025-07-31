import { IsEmail } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ResetPasswordDto {
  @ApiProperty({
    example: 'usuario@ejemplo.com',
    description: 'Email del usuario que solicita el reinicio de contraseña',
  })
  @IsEmail()
  email: string;
}
