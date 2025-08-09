import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { StageParameter } from './stage-parameter.entity';
import { StageRuleType } from 'src/common/enums/stage-rule-type.enum';
@Entity('StageRule')
export class StageRule {
  @PrimaryGeneratedColumn('uuid')
  ruleID: string;

  @Column({
    type: 'varchar',
    enum: StageRuleType,
    default: StageRuleType.NUMBER, // Default type can be adjusted as needed
    nullable: false,
  })
  ruleType: StageRuleType;

  @Column({ length: 255, nullable: true })
  ruleName: string;

  @Column({ length: 255, nullable: true })
  ruleDescription: string;

  // Relations
  @OneToMany(() => StageParameter, (parameter) => parameter.rule)
  parameters: StageParameter[];
}
