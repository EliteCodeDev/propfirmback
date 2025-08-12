import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { ChallengeBalance } from './challenge-balance.entity';
import { ChallengeRelation } from '../challenge-relation.entity';
import { ChallengeStage } from '../stage';

@Entity('RelationBalance')
export class RelationBalance {
  @PrimaryGeneratedColumn('uuid')
  relationBalanceID: string;

  @Column({ type: 'uuid' })
  balanceID: string;

  @Column({ type: 'uuid' })
  relationID: string;

  @Column({ type: 'float', nullable: true })
  price: number;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @Column({ type: 'boolean', default: false })
  hasDiscount: boolean;

  @Column({ type: 'float', nullable: true })
  discount: number;

  // Relations
  @ManyToOne(() => ChallengeBalance, (balance) => balance.relationBalances)
  @JoinColumn({ name: 'balanceID' })
  balance: ChallengeBalance;

  @ManyToOne(() => ChallengeRelation, (relation) => relation.relationBalances)
  @JoinColumn({ name: 'relationID' })
  relation: ChallengeRelation;
}
