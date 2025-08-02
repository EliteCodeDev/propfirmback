import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { ChallengeStage } from './challenge-stage.entity';
import { ChallengeRelation } from './challenge-relation.entity';
import { StageParameter } from './stage-parameter.entity';

@Entity('RelationStage')
export class RelationStage {
  @PrimaryGeneratedColumn('uuid')
  relationStageID: string;

  @Column({ type: 'uuid' })
  stageID: string;

  @Column({ type: 'uuid' })
  relationID: string;

  @Column({ type: 'int', nullable: true })
  numPhase: number;

  // Relations
  @ManyToOne(() => ChallengeStage, (stage) => stage.relationStages)
  @JoinColumn({ name: 'stageID' })
  stage: ChallengeStage;

  @ManyToOne(() => ChallengeRelation, (relation) => relation.stages)
  @JoinColumn({ name: 'relationID' })
  relation: ChallengeRelation;

  @OneToMany(() => StageParameter, (parameter) => parameter.relationStage)
  parameters: StageParameter[];
}
