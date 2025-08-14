import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  Index,
} from 'typeorm';
import { Challenge } from '../../challenges/entities/challenge.entity';

@Entity('BrokerAccount')
export class BrokerAccount {
  @PrimaryGeneratedColumn('uuid')
  brokerAccountID: string;

  @Column({ length: 50, unique: true })
  login: string;

  @Column({ length: 255 })
  password: string;

  @Column({ length: 150, nullable: true })
  server: string;

  @Column({ length: 45, nullable: true })
  serverIp: string;

  @Column({ length: 20, nullable: true })
  platform: string;

  @Column({ type: 'boolean', default: false })
  @Index('IX_Broker_Used')
  isUsed: boolean;

  @Column({ length: 255, nullable: true })
  investorPass: string;

  @Column({ type: 'decimal', precision: 18, scale: 2, nullable: true })
  innitialBalance: number;

  // Relations
  @OneToMany(() => Challenge, (challenge) => challenge.brokerAccount)
  challenges: Challenge[];
}
