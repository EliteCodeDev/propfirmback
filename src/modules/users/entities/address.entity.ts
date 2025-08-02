import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { UserAccount } from './user-account.entity';

@Entity('Address')
export class Address {
  @PrimaryGeneratedColumn('uuid')
  addressID: string;

  @Column({ type: 'uuid', unique: true })
  userID: string;

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
  @OneToOne(() => UserAccount, (user) => user.address)
  @JoinColumn({ name: 'userID' })
  user: UserAccount;
}
