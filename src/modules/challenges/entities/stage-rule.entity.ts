import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { StageParameter } from './stage-parameter.entity';

@Entity('StageRule')
export class StageRule {
  @PrimaryGeneratedColumn('uuid')
  ruleID: string;

  @Column({
    type: 'enum',
    enum: ['number', 'percentage', 'boolean', 'string'],
  })
  ruleType: string;

  @Column({ length: 255, nullable: true })
  ruleName: string;

  @Column({ length: 255, nullable: true })
  ruleDescription: string;

  // Relations
  @OneToMany(() => StageParameter, parameter => parameter.rule)
  parameters: StageParameter[];
}
