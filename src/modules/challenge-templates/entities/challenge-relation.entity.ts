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
import { RelationBalance } from './balance';
import { RelationStage } from './stage';
import { Challenge } from 'src/modules/challenges/entities/challenge.entity';
import { RelationAddon } from './addons/relation-addon.entity';
import { RelationRules } from './rules/relation-rule.entity';

@Entity('ChallengeRelation')
export class ChallengeRelation {
  @PrimaryGeneratedColumn('uuid')
  relationID: string;

  @Column({ type: 'uuid', nullable: true })
  categoryID?: string;

  @Column({ type: 'uuid' })
  planID: string;

  // Relations
  @ManyToOne(() => ChallengeCategory, (category) => category.relations, {
    nullable: true,
  })
  @JoinColumn({ name: 'categoryID' })
  category?: ChallengeCategory;

  @ManyToOne(() => ChallengePlan, (plan) => plan.relations)
  @JoinColumn({ name: 'planID' })
  plan: ChallengePlan;

  @OneToMany(() => Challenge, (challenge) => challenge.relation)
  challenges: Challenge[];

  @OneToMany(() => RelationStage, (stage) => stage.relation)
  stages: RelationStage[];

  @OneToMany(
    () => RelationBalance,
    (relationBalance) => relationBalance.relation,
  )
  balances: RelationBalance[];

  @OneToMany(() => RelationAddon, (relationAddon) => relationAddon.relation)
  addons: RelationAddon[];

  @Column({ type: 'varchar', length: 255, nullable: true })
  groupName?: string;

  @OneToMany(
    () => RelationRules,
    (rulesWithdrawal) => rulesWithdrawal.relation,
  )
  withdrawalRules: RelationRules[];
}
