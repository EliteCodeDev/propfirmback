import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { ChallengeAddon } from './challenge-addon.entity';
import { ChallengeRelation } from '../challenge-relation.entity';

@Entity('RelationAddon')
export class RelationAddon {
  @PrimaryGeneratedColumn('uuid')
  relationAddonID: string;

  @Column({ type: 'uuid' })
  addonID: string;

  @Column({ type: 'uuid' })
  relationID: string;

  @Column({ type: 'float', nullable: true, default: 0 })
  price: number;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @Column({ type: 'boolean', default: false })
  hasDiscount: boolean;

  @Column({ type: 'float', nullable: true, default: 0 })
  discount: number;

  @Column({ type: 'float', nullable: true })
  wooID: number;

  // Relations
  @ManyToOne(() => ChallengeAddon, (addon) => addon.relationAddons)
  @JoinColumn({ name: 'addonID' })
  addon: ChallengeAddon;

  @ManyToOne(() => ChallengeRelation, (relation) => relation.addons)
  @JoinColumn({ name: 'relationID' })
  relation: ChallengeRelation;
}
