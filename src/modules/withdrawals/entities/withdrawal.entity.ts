import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { UserAccount } from '../../users/entities/user-account.entity';
import { Challenge } from '../../challenges/entities/challenge.entity';

@Entity('Withdrawal')
export class Withdrawal {
  @PrimaryGeneratedColumn('uuid')
  withdrawalID: string;

  @Column({ type: 'uuid' })
  userId: string;

  @Column({ length: 150 })
  wallet: string;

  @Column({ type: 'decimal', precision: 18, scale: 2 })
  amount: number;

  @Column({ length: 255, nullable: true })
  observation: string;

  @Column({
    type: 'enum',
    enum: ['pending', 'approved', 'paid', 'rejected'],
    default: 'pending',
  })
  status: string;

  @CreateDateColumn()
  createdAt: Date;

  @Column({ type: 'uuid', nullable: true })
  challengeID: string;

  // Relations
  @ManyToOne(() => UserAccount, (user) => user.withdrawals)
  @JoinColumn({ name: 'userId' })
  user: UserAccount;

  @ManyToOne(() => Challenge, (challenge) => challenge.withdrawals)
  @JoinColumn({ name: 'challengeID' })
  challenge: Challenge;
}
