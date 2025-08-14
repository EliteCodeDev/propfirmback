import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString } from 'class-validator';

export class DataProcessDto {
  @ApiProperty({
    description: 'Account associated with the process',
    example: 'id123',
    required: true
  })
  @IsString()
  account!: string;

  @ApiProperty({
    description: 'Process status',
    example: 200
  })
  @IsNumber()
  @IsOptional()
  status?: number;

  @ApiProperty({
    description: 'Process error if exists',
    required: false,
    example: null
  })
  @IsOptional()
  error?: any;
}

export class ConnectionStatusDto {
  @ApiProperty({
    description: 'Successful processes',
    type: [DataProcessDto],
    example: [
      {
        user: 'user123',
        status: 200,
        error: null
      }
    ]
  })
  success_process!: DataProcessDto[] | [];

  @ApiProperty({
    description: 'Processes with errors',
    type: [DataProcessDto],
    example: [
      {
        user: 'user456',
        status: 500,
        error: 'Connection failed'
      }
    ]
  })
  error_process!: DataProcessDto[] | [];

  @ApiProperty({
    description: 'Response status',
    example: 200
  })
  @IsNumber()
  @IsOptional()
  status?: number;

  @ApiProperty({
    description: 'Response message',
    example: 'Success session'
  })
  @IsString()
  @IsOptional()
  message?: string;
}