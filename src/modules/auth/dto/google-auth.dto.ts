import { IsString, IsEmail, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class GoogleAuthDto {
  @ApiProperty({
    description: 'Google ID del usuario',
    example: '1234567890123456789',
  })
  @IsString()
  googleId: string;

  @ApiProperty({
    description: 'Email del usuario desde Google',
    example: 'usuario@gmail.com',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    description: 'Nombre del usuario desde Google',
    example: 'Juan',
    required: false,
  })
  @IsOptional()
  @IsString()
  firstName?: string;

  @ApiProperty({
    description: 'Apellido del usuario desde Google',
    example: 'Pérez',
    required: false,
  })
  @IsOptional()
  @IsString()
  lastName?: string;

  @ApiProperty({
    description: 'URL del avatar desde Google',
    example: 'https://lh3.googleusercontent.com/...',
    required: false,
  })
  @IsOptional()
  @IsString()
  avatar?: string;

  @ApiProperty({
    description: 'Token de acceso de Google',
    example: 'ya29.a0AfH6SMC...',
  })
  @IsString()
  accessToken: string;
}

export class GoogleCallbackDto {
  @ApiProperty({
    description: 'Código de autorización de Google',
    example: '4/0AX4XfWh...',
  })
  @IsString()
  code: string;

  @ApiProperty({
    description: 'Estado para verificar la solicitud',
    example: 'random-state-string',
    required: false,
  })
  @IsOptional()
  @IsString()
  state?: string;
}