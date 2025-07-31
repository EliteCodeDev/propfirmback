import { Entity, PrimaryColumn, Column, OneToOne, JoinColumn } from 'typeorm';
import { Challenge } from './challenge.entity';

@Entity('ChallengeDetails')
export class ChallengeDetails {
  @PrimaryColumn('uuid')
  challengeID: string;

  @Column({ type: 'text', nullable: true })
  metadata: string;

  @Column({ type: 'text', nullable: true })
  dataAdmin: string;

  @Column({ type: 'text', nullable: true })
  validationRules: string;

  @Column({ type: 'decimal', precision: 18, scale: 2, nullable: true })
  dynamicBalance: number;

  @Column({ type: 'timestamp', nullable: true })
  lastUpdate: Date;

  // Relations
  @OneToOne(() => Challenge, challenge => challenge.details)
  @JoinColumn({ name: 'challengeID' })
  challenge: Challenge;
}