import { ApiProperty } from '@nestjs/swagger';

export class DataProcessDto {
  @ApiProperty({
    description: 'Usuario asociado al proceso',
    example: 'user123'
  })
  user: string;

  @ApiProperty({
    description: 'Estado del proceso',
    example: 200
  })
  status: number;

  @ApiProperty({
    description: 'Error del proceso si existe',
    required: false,
    example: null
  })
  error: any;
}

export class ConnectionStatusDto {
  @ApiProperty({
    description: 'Procesos exitosos',
    type: [DataProcessDto],
    example: [
      {
        user: 'user123',
        status: 200,
        error: null
      }
    ]
  })
  success_process: DataProcessDto[];

  @ApiProperty({
    description: 'Procesos con error',
    type: [DataProcessDto],
    example: [
      {
        user: 'user456',
        status: 500,
        error: 'Connection failed'
      }
    ]
  })
  error_process: DataProcessDto[];

  @ApiProperty({
    description: 'Estado de la respuesta',
    example: 200
  })
  status: number;

  @ApiProperty({
    description: 'Mensaje de la respuesta',
    example: 'Success session'
  })
  message: string;
}