import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsString, IsOptional } from 'class-validator';
import { VerificationStatus } from 'src/common/enums/verification-status.enum';

export class UpdateVerificationDto {
  @ApiProperty({ enum: VerificationStatus, required: false })
  @IsOptional()
  @IsEnum(VerificationStatus)
  status?: VerificationStatus;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  rejectionReason?: string;
  
}