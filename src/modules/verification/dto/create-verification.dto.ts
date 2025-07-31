import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsString, IsOptional } from 'class-validator';

export class CreateVerificationDto {
  @ApiProperty({ enum: ['dni', 'passport', 'driver_license', 'other'] })
  @IsEnum(['dni', 'passport', 'driver_license', 'other'])
  documentType: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  numDocument?: string;
}