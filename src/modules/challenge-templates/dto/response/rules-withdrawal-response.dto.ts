import { ApiProperty } from '@nestjs/swagger';
import { WithdrawalRule } from '../../entities/rules/withdrawal-rule.entity';
import { ChallengeRelation } from '../../entities/challenge-relation.entity';

export class RulesWithdrawalResponseDto {
  @ApiProperty({
    description: 'ID de la regla asociada',
    example: '550e8400-e29b-41d4-a716-446655440000',
    format: 'uuid',
  })
  ruleID: string;

  @ApiProperty({
    description: 'ID de la relación de challenge asociada',
    example: '550e8400-e29b-41d4-a716-446655440001',
    format: 'uuid',
  })
  relationID: string;

  @ApiProperty({
    description: 'Valor de la regla de retiro',
    example: 'Regla de retiro específica para este challenge',
    maxLength: 100,
  })
  value: string;

  @ApiProperty({
    description: 'Información de la regla asociada',
    type: () => WithdrawalRule,
    required: false,
  })
  rules?: WithdrawalRule;

  @ApiProperty({
    description: 'Información de la relación de challenge asociada',
    type: () => ChallengeRelation,
    required: false,
  })
  relation?: ChallengeRelation;
}
