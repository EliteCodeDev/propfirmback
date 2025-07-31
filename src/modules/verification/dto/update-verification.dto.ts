import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsString, IsOptional } from 'class-validator';

export class UpdateVerificationDto {
  @ApiProperty({ enum: ['pending', 'approved', 'rejected'], required: false })
  @IsOptional()
  @IsEnum(['pending', 'approved', 'rejected'])
  status?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  rejectionReason?: string;
}