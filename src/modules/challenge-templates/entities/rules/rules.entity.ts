import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany } from 'typeorm';
import { RulesWithdrawal } from './rules-withdrawal.entity';

@Entity('rules')
export class Rules {

    @PrimaryGeneratedColumn('uuid')
    idRule: string

    @Column('varchar',{ length: 100, nullable: false })
    nameRule: string

    @Column('varchar',{ length: 100, nullable: true })
    slugRule: string

    @Column('varchar',{ length: 100, nullable: true })
    descriptionRule: string

    @Column('varchar', { nullable: true })
    ruleType: string;

    @OneToMany(() => RulesWithdrawal, (rulesWithdrawal) => rulesWithdrawal.idRule)
    rulesWithdrawal: RulesWithdrawal[];
    
}