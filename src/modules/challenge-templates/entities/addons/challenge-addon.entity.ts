import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { ChallengeRelation } from '../challenge-relation.entity';
import { RelationAddon } from './relation-addon.entity';

@Entity('ChallengeAddon')
export class ChallengeAddon {
  @PrimaryGeneratedColumn('uuid')
  addonID: string;

  @Column({ length: 100 })
  name: string;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @Column({ type: 'boolean', default: false })
  hasDiscount: boolean;

  @Column({ type: 'float', nullable: true })
  discount: number;

  @Column({ type: 'decimal', precision: 18, scale: 2, nullable: true })
  balance: number;

  // Relations
  @OneToMany(() => RelationAddon, (relationAddon) => relationAddon.addon)
  relationAddons: RelationAddon[];
}
