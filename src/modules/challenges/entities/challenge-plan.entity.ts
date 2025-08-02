import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { ChallengeRelation } from './challenge-relation.entity';

@Entity('ChallengePlan')
export class ChallengePlan {
  @PrimaryGeneratedColumn('uuid')
  planID: string;

  @Column({ length: 100 })
  name: string;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @Column({ type: 'bigint', nullable: true })
  wooID: number;

  // Relations
  @OneToMany(() => ChallengeRelation, (relation) => relation.plan)
  relations: ChallengeRelation[];
}
