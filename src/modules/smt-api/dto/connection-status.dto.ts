import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsNumber, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

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
    example: [{ account: 'user123', status: 200, error: null }]
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DataProcessDto)
  success_process!: DataProcessDto[];

  @ApiProperty({
    description: 'Processes with errors',
    type: [DataProcessDto],
    example: [{ account: 'user456', status: 500, error: 'Connection failed' }]
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DataProcessDto)
  error_process!: DataProcessDto[];

  @ApiProperty({ description: 'Response status', example: 200 })
  @IsNumber()
  @IsOptional()
  status?: number;

  @ApiProperty({ description: 'Response message', example: 'Success session' })
  @IsString()
  @IsOptional()
  message?: string;
}