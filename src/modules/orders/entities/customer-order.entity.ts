import { Entity, PrimaryColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { UserAccount } from '../../users/entities/user-account.entity';
import { Challenge } from '../../challenges/entities/challenge.entity';

@Entity('CustomerOrder')
export class CustomerOrder {
  @PrimaryColumn({ type: 'char', length: 18 })
  orderID: string;

  @Column({ type: 'uuid' })
  userId: string;

  @CreateDateColumn()
  dateCreated: Date;

  @Column({ length: 30 })
  statusOrder: string;

  @Column({ type: 'bigint', nullable: true })
  idWoo: number;

  @Column({ type: 'decimal', precision: 18, scale: 2, nullable: true })
  total: number;

  @Column({ type: 'text', nullable: true })
  products: string;

  @Column({ length: 100, nullable: true })
  orderKey: string;

  @Column({ type: 'uuid', nullable: true })
  documentChallenge: string;

  // Relations
  @ManyToOne(() => UserAccount, user => user.orders)
  @JoinColumn({ name: 'userId' })
  user: UserAccount;

  @ManyToOne(() => Challenge, challenge => challenge.orders)
  @JoinColumn({ name: 'documentChallenge' })
  challenge: Challenge;
}