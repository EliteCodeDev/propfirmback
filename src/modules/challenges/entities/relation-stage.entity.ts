import { Entity, PrimaryColumn, Column, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { ChallengeStage } from './challenge-stage.entity';
import { ChallengeRelation } from './challenge-relation.entity';
import { StageParameter } from './stage-parameter.entity';

@Entity('RelationStage')
export class RelationStage {
  @PrimaryColumn({ type: 'char', length: 18 })
  relationStageID: string;

  @Column({ type: 'uuid' })
  stageID: string;

  @Column({ type: 'uuid' })
  relationID: string;

  @Column({ type: 'char', length: 18, nullable: true })
  numPhase: string;

  // Relations
  @ManyToOne(() => ChallengeStage, stage => stage.relationStages)
  @JoinColumn({ name: 'stageID' })
  stage: ChallengeStage;

  @ManyToOne(() => ChallengeRelation, relation => relation.stages)
  @JoinColumn({ name: 'relationID' })
  relation: ChallengeRelation;

  @OneToMany(() => StageParameter, parameter => parameter.relationStage)
  parameters: StageParameter[];
}