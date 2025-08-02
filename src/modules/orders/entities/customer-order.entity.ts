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

@Entity('CustomerOrder')
export class CustomerOrder {
  @PrimaryGeneratedColumn('uuid')
  orderID: string;

  @Column({ type: 'uuid' })
  userID: string;

  @CreateDateColumn()
  dateCreated: Date;

  @Column({ length: 30 })
  statusOrder: string;

  @Column({ type: 'bigint', nullable: true })
  wooID: number;

  @Column({ type: 'decimal', precision: 18, scale: 2, nullable: true })
  total: number;

  @Column({ type: 'text', nullable: true })
  products: string;

  @Column({ length: 100, nullable: true })
  orderKey: string;

  @Column({ type: 'uuid', nullable: true })
  documentChallenge: string;

  // Relations
  @ManyToOne(() => UserAccount, (user) => user.orders)
  @JoinColumn({ name: 'userID' })
  user: UserAccount;

  @ManyToOne(() => Challenge, (challenge) => challenge.orders)
  @JoinColumn({ name: 'documentChallenge' })
  challenge: Challenge;
}
