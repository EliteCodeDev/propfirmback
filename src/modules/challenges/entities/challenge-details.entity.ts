import { Entity, PrimaryColumn, Column, OneToOne, JoinColumn } from 'typeorm';
import { Challenge } from './challenge.entity';

@Entity('ChallengeDetails')
export class ChallengeDetails {
  @PrimaryColumn('uuid')
  challengeID: string;

  @Column({ type: 'text', nullable: true })
  metaStats: string;

  @Column({ type: 'text', nullable: true })
  positions: string;

  @Column({ type: 'text', nullable: true })
  rulesValidation: string;

  @Column({ type: 'timestamp', nullable: true })
  lastUpdate: Date;

  // Relations
  @OneToOne(() => Challenge, (challenge) => challenge.details)
  @JoinColumn({ name: 'challengeID' })
  challenge: Challenge;
}
