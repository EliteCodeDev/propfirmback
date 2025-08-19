import { ApiProperty } from '@nestjs/swagger';
import {
  IsOptional,
  IsUUID,
  IsDateString,
  IsNumber,
  IsEnum,
  IsBoolean,
  IsDate,
} from 'class-validator';
import { ChallengeStatus } from 'src/common/enums/challenge-status.enum';

export class CreateChallengeDto {
  @ApiProperty({ required: true })
  @IsUUID()
  userID: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsUUID()
  relationID?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsDate()
  startDate?: Date;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsDate()
  endDate?: Date;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  numPhase?: number;

  @ApiProperty({
    enum: ChallengeStatus,
    required: false,
  })
  @IsOptional()
  @IsEnum(ChallengeStatus)
  status?: ChallengeStatus;

  @ApiProperty({ default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean = true;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsUUID()
  parentID?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsUUID()
  brokerAccountID?: string;
}
