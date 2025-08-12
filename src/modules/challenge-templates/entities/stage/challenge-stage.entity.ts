import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { RelationStage } from './relation-stage.entity';

@Entity('ChallengeStage')
export class ChallengeStage {
  @PrimaryGeneratedColumn('uuid')
  stageID: string;

  @Column({ length: 100 })
  name: string;

  // Relations
  @OneToMany(() => RelationStage, (relationStage) => relationStage.stage)
  relationStages: RelationStage[];
}
