import { Entity, Column, OneToMany, ForeignKey, ManyToOne, JoinColumn, PrimaryColumn } from 'typeorm';
import { RelationAddon } from './relation-addon.entity';
import { Addon } from "./addon.entity"
import { Challenge } from 'src/modules/challenges/entities/challenge.entity';

@Entity("ChallengeAddon")
export class ChallengeAddon {

    @PrimaryColumn('uuid')
    addonID: string

    @PrimaryColumn('uuid')
    challengeID: string

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

    @ManyToOne(() => Addon, (addon) => addon.challengeAddons)
    @JoinColumn({name: "addonID"})
    addon: Addon;

    @ManyToOne(() => Challenge, (challenge) => challenge.addons)
    @JoinColumn({name: "challengeID"})
    challenge: Challenge;
    
}