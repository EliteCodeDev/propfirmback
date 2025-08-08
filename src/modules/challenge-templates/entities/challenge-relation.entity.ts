import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { ChallengeCategory } from './challenge-category.entity';
import { ChallengePlan } from './challenge-plan.entity';
import { ChallengeBalance } from './challenge-balance.entity';
import { Challenge } from 'src/modules/challenges/entities/challenge.entity';
import { RelationStage } from './stage/relation-stage.entity';

@Entity('ChallengeRelation')
export class ChallengeRelation {
  @PrimaryGeneratedColumn('uuid')
  relationID: string;

  @Column({ type: 'uuid' })
  subcategoryID: string;

  @Column({ type: 'uuid' })
  planID: string;

  @Column({ type: 'uuid', nullable: true })
  balanceID: string;

  // Relations
  @ManyToOne(() => ChallengeCategory, (category) => category.relations)
  @JoinColumn({ name: 'subcategoryID' })
  category: ChallengeCategory;

  @ManyToOne(() => ChallengePlan, (plan) => plan.relations)
  @JoinColumn({ name: 'planID' })
  plan: ChallengePlan;

  @OneToMany(() => Challenge, (challenge) => challenge.relation)
  challenges: Challenge[];

  @OneToMany(() => RelationStage, (stage) => stage.relation)
  stages: RelationStage[];

  @ManyToOne(() => ChallengeBalance, (balance) => balance.relations)
  @JoinColumn({ name: 'balanceID' })
  balance: ChallengeBalance;
}
