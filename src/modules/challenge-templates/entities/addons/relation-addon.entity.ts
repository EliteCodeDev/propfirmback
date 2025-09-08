import { Entity, Column, ManyToOne, JoinColumn, PrimaryColumn } from 'typeorm';
import { Addon } from './addon.entity';
import { ChallengeRelation } from '../challenge-relation.entity';

@Entity('RelationAddon')
export class RelationAddon {
  @PrimaryColumn('uuid')
  addonID: string;

  @PrimaryColumn('uuid')
  relationID: string;

  @Column({ type: 'json', nullable: true })
  value: number | boolean | null;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @Column({ type: 'boolean', default: false })
  hasDiscount: boolean;

  @Column({ type: 'float', nullable: true, default: 0 })
  discount: number;

  @Column({ type: 'float', nullable: true })
  wooID: number;

  // Relations
  @ManyToOne(() => Addon, (addon) => addon.relationAddons)
  @JoinColumn({ name: 'addonID' })
  addon: Addon;

  @ManyToOne(() => ChallengeRelation, (relation) => relation.addons)
  @JoinColumn({ name: 'relationID' })
  relation: ChallengeRelation;
}
