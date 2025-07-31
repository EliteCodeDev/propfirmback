import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsUUID, IsDateString, IsNumber, IsEnum, IsBoolean } from 'class-validator';

export class CreateChallengeDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsUUID()
  relationId?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsDateString()
  startDate?: Date;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsDateString()
  endDate?: Date;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  numPhase?: number;

  @ApiProperty({ 
    enum: ['in_progress', 'passed', 'failed', 'cancelled'],
    required: false 
  })
  @IsOptional()
  @IsEnum(['in_progress', 'passed', 'failed', 'cancelled'])
  status?: string;

  @ApiProperty({ default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean = true;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsUUID()
  parentId?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsUUID()
  brokerAccountID?: string;
}