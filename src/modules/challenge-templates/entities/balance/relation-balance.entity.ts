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

  @Column({ type: 'float', nullable: true, default: 0 })
  price: number;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @Column({ type: 'boolean', default: false })
  hasDiscount: boolean;

  @Column({ type: 'float', nullable: true, default: 0 })
  discount: number;

  @Column({ type: 'number', nullable: true })
  wooID: number;

  // Relations
  @ManyToOne(() => ChallengeBalance, (balance) => balance.relationBalances)
  @JoinColumn({ name: 'balanceID' })
  balance: ChallengeBalance;

  @ManyToOne(() => ChallengeRelation, (relation) => relation.balances)
  @JoinColumn({ name: 'relationID' })
  relation: ChallengeRelation;
}
