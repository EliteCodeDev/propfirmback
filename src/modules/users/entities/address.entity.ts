import { Entity, PrimaryColumn, Column, OneToOne, JoinColumn } from 'typeorm';
import { UserAccount } from './user-account.entity';

@Entity('Address')
export class Address {
  @PrimaryColumn({ type: 'char', length: 18 })
  addresID: string;

  @Column({ type: 'uuid', unique: true })
  userId: string;

  @Column({ length: 100, nullable: true })
  country: string;

  @Column({ length: 100, nullable: true })
  state: string;

  @Column({ length: 100, nullable: true })
  city: string;

  @Column({ length: 20, nullable: true })
  zipCode: string;

  @Column({ length: 255, nullable: true })
  addressLine1: string;

  @Column({ length: 255, nullable: true })
  addressLine2: string;

  // Relations
  @OneToOne(() => UserAccount, user => user.address)
  @JoinColumn({ name: 'userId' })
  user: UserAccount;
}