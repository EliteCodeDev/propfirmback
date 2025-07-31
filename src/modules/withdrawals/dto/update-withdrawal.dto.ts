import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsString, IsOptional } from 'class-validator';

export class UpdateWithdrawalDto {
  @ApiProperty({ enum: ['pending', 'approved', 'paid', 'rejected'], required: false })
  @IsOptional()
  @IsEnum(['pending', 'approved', 'paid', 'rejected'])
  status?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  observation?: string;
}