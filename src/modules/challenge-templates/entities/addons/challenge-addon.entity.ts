import { Entity, Column, ManyToOne, JoinColumn, PrimaryColumn } from 'typeorm';
import { Addon } from './addon.entity';
import { Challenge } from 'src/modules/challenges/entities/challenge.entity';

@Entity('ChallengeAddon')
export class ChallengeAddon {
  @PrimaryColumn('uuid')
  addonID: string;

  @PrimaryColumn('uuid')
  challengeID: string;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @Column({ type: 'float', nullable: true })
  wooID: number;

  @Column({ type: 'json', nullable: true, default: 0 })
  value: number | boolean | null;

  @ManyToOne(() => Addon, (addon) => addon.challengeAddons)
  @JoinColumn({ name: 'addonID' })
  addon: Addon;

  @ManyToOne(() => Challenge, (challenge) => challenge.addons)
  @JoinColumn({ name: 'challengeID' })
  challenge: Challenge;
}