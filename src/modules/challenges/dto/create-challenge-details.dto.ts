import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsUUID,
  IsDateString,
  ValidateNested,
  IsObject,
} from 'class-validator';
import { Type } from 'class-transformer';
import { MetaStats, positionsDetails } from 'src/common/utils/account';
import { RiskParams } from 'src/common/utils/risk';
import { riskEvaluationResult } from 'src/common/types/risk-results';

export class CreateChallengeDetailsDto {
  @ApiProperty({
    description: 'Challenge ID (UUID)',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  challengeID: string;

  @ApiProperty({
    description: 'Meta statistics data',
    type: () => MetaStats,
    required: false,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => MetaStats)
  metaStats?: MetaStats;

  @ApiProperty({
    description: 'Positions data',
    type: () => positionsDetails,
    required: false,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => positionsDetails)
  positions?: positionsDetails;

  @ApiProperty({
    description: 'Rules validation data',
    type: () => Object,
    required: false,
  })
  @IsOptional()
  @IsObject()
  rulesValidation?: riskEvaluationResult;

  @ApiProperty({
    description: 'Rules parameters data',
    type: () => RiskParams,
    required: false,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => RiskParams)
  rulesParams?: RiskParams;

  @ApiProperty({
    description: 'Last update timestamp',
    example: '2024-01-15T10:30:00Z',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  lastUpdate?: Date;
}
