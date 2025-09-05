import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
} from 'typeorm';
import { RelationRules } from './relation-rule.entity';

@Entity('withdrawalRule')
export class WithdrawalRule {
  @PrimaryGeneratedColumn('uuid')
  ruleID: string;

  @Column('varchar', { length: 100, nullable: false })
  nameRule: string;

  @Column('varchar', { length: 100, nullable: true })
  slugRule: string;

  @Column('varchar', { length: 100, nullable: true })
  descriptionRule: string;

  @Column('varchar', { nullable: true })
  ruleType: string;

  @OneToMany(() => RelationRules, (relationRules) => relationRules.rule)
  relationRules: RelationRules[];
}
