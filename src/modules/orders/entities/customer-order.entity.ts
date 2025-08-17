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
import { OrderStatus } from 'src/common/enums/order-status.enum';
import { wooOrderProduct } from '../types';
@Entity('CustomerOrder')
export class CustomerOrder {
  @PrimaryGeneratedColumn('uuid')
  orderID: string;

  @Column({ type: 'uuid' })
  userID: string;

  @CreateDateColumn()
  createDateTime: Date;

  @Column({ length: 30 })
  orderStatus: OrderStatus;

  @Column({ type: 'bigint', nullable: true })
  wooID: number;

  @Column({ type: 'decimal', precision: 18, scale: 2, nullable: true })
  total: number;

  @Column({ type: 'text', nullable: true })
  product: string;

  @Column({ type: 'uuid', nullable: true })
  challengeID: string;

  // Relations
  @ManyToOne(() => UserAccount, (user) => user.orders)
  @JoinColumn({ name: 'userID' })
  user: UserAccount;

  @ManyToOne(() => Challenge, (challenge) => challenge.orders)
  @JoinColumn({ name: 'challengeID' })
  challenge: Challenge;
}
