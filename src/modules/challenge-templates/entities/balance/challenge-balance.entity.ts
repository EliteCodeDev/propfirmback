import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { ChallengeRelation } from '../challenge-relation.entity';
import { RelationBalance } from './relation-balance.entity';

@Entity('ChallengeBalance')
export class ChallengeBalance {
  @PrimaryGeneratedColumn('uuid')
  balanceID: string;

  @Column({ length: 100 })
  name: string;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @Column({ type: 'boolean', default: false })
  hasDiscount: boolean;

  @Column({ type: 'float', nullable: true })
  discount: number;

  @Column({ type: 'decimal', precision: 18, scale: 2, nullable: true })
  balance: number;

  // Relations
  @OneToMany(
    () => RelationBalance,
    (relationBalance) => relationBalance.balance,
  )
  relationBalances: RelationBalance[];
}
