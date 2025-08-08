import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { StageRuleType } from '../../../common/enums/stage-rule-type.enum';

export class CreateStageRuleDto {
  @ApiProperty({
    description: 'Type of the stage rule',
    enum: StageRuleType,
    example: StageRuleType.NUMBER,
  })
  @IsEnum(StageRuleType)
  ruleType: StageRuleType;

  @ApiProperty({
    description: 'Name of the stage rule',
    example: 'Daily Drawdown Rule',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  ruleName?: string;

  @ApiProperty({
    description: 'Description of the stage rule',
    example: 'Maximum daily loss allowed',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  ruleDescription?: string;
}
