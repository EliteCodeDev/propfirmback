import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsUUID,
  IsBoolean,
  IsArray,
  ValidateNested,
  IsOptional,
  MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateStageRuleForRelationDto {
  @ApiProperty({
    description: 'Rule ID reference',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  ruleID: string;

  @ApiProperty({
    description: 'Rule name',
    example: 'Maximum Drawdown',
  })
  @IsString()
  @MaxLength(255)
  ruleName: string;

  @ApiProperty({
    description: 'Rule value',
    example: '5000',
  })
  @IsString()
  @MaxLength(255)
  ruleValue: string;
}

export class CreateStageForRelationDto {
  @ApiProperty({
    description: 'Stage ID reference',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  stageID: string;

  @ApiProperty({
    description: 'Stage name',
    example: 'Phase 1',
  })
  @IsString()
  @MaxLength(255)
  stageName: string;

  // @ApiProperty({
  //   description: 'Whether the stage is active',
  //   example: true,
  //   default: true,
  // })
  // @IsBoolean()
  // isActive: boolean;

  @ApiProperty({
    description: 'Rules for this stage',
    type: [CreateStageRuleForRelationDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateStageRuleForRelationDto)
  rules: CreateStageRuleForRelationDto[];
}

export class CreateRelationStagesDto {
  @ApiProperty({
    description: 'Challenge Relation ID reference',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  challengeRelationID: string;

  @ApiProperty({
    description: 'Stages with their rules',
    type: [CreateStageForRelationDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateStageForRelationDto)
  stages: CreateStageForRelationDto[];
}
