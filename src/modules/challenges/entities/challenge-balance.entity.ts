import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { ChallengeRelation } from './challenge-relation.entity';

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

  @Column({ length: 50, nullable: true })
  discount: string;

  @Column({ type: 'char', length: 18, nullable: true })
  balance: string;

  // Relations
  @OneToMany(() => ChallengeRelation, relation => relation.balance)
  relations: ChallengeRelation[];
}