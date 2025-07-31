import { Entity, PrimaryColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { StageRule } from './stage-rule.entity';
import { RelationStage } from './relation-stage.entity';

@Entity('StageParameter')
export class StageParameter {
  @PrimaryColumn('uuid')
  ruleID: string;

  @PrimaryColumn({ type: 'char', length: 18 })
  relationStageID: string;

  @Column({ length: 255 })
  ruleValue: string;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  // Relations
  @ManyToOne(() => StageRule, rule => rule.parameters)
  @JoinColumn({ name: 'ruleID' })
  rule: StageRule;

  @ManyToOne(() => RelationStage, stage => stage.parameters)
  @JoinColumn({ name: 'relationStageID' })
  relationStage: RelationStage;
}