import { Entity, PrimaryColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Rules } from './rules.entity';
import { ChallengeRelation } from '../challenge-relation.entity';

@Entity('rulesWithdrawal')
export class RulesWithdrawal {

    @PrimaryColumn('uuid')
    idRule: string;

    @PrimaryColumn('uuid')
    relationID: string;

    @Column('varchar', { length: 100, nullable: false })
    value: string;

    @ManyToOne(() => Rules, (rules) => rules.rulesWithdrawal)
    @JoinColumn({ name: 'idRule' })
    rules: Rules;

    @ManyToOne(() => ChallengeRelation, (relation) => relation.rulesWithdrawal)
    @JoinColumn({ name: 'relationID' })
    relation: ChallengeRelation;

}