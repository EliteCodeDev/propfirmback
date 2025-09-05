import { Entity, PrimaryColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { WithdrawalRule } from './withdrawal-rule.entity';
import { ChallengeRelation } from '../challenge-relation.entity';

@Entity('RelationRules')
export class RelationRules {
  @PrimaryColumn('uuid')
  ruleID: string;

  @PrimaryColumn('uuid')
  relationID: string;

  @Column('varchar', { length: 100, nullable: false })
  value: string;

  @ManyToOne(() => WithdrawalRule, (rules) => rules.relationRules)
  @JoinColumn({ name: 'idRule' })
  rule: WithdrawalRule;

  @ManyToOne(() => ChallengeRelation, (relation) => relation.withdrawalRules)
  @JoinColumn({ name: 'relationID' })
  relation: ChallengeRelation;
}
