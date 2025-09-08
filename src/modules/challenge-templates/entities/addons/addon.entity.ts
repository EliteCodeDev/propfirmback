import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { RelationAddon } from './relation-addon.entity';
import { ChallengeAddon } from './challenge-addon.entity';

@Entity('Addons')
export class Addon {
  @PrimaryGeneratedColumn('uuid')
  addonID: string;

  @Column({ length: 100 })
  name: string;
  
  @Column({ length: 100, nullable: true })
  slugRule: string;

  @Column({ 
    type: 'enum', 
    enum: ['number', 'boolean', 'percentage'], 
    default: 'number',
    nullable: true 
  })
  valueType: 'number' | 'boolean' | 'percentage';

  @Column({ type: 'boolean', default: true, nullable: true })
  isActive: boolean;

  @Column({ type: 'boolean', default: false })
  hasDiscount: boolean;

  @Column({ type: 'float', nullable: true })
  discount: number;

  // Relations
  @OneToMany(() => RelationAddon, (relationAddon) => relationAddon.addon)
  relationAddons: RelationAddon[];

  @OneToMany(() => ChallengeAddon, (addon) => addon.addon)
  challengeAddons: ChallengeAddon[];
}
