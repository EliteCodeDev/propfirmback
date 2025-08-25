// gaaa
import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

@Entity("BusinessRequirement")
export class BusinessRequirement{

    @PrimaryGeneratedColumn("increment")
    id: number;

    @Column({length: 30, nullable: false})
    type: string;

    @Column('json')
    metadata: object;

    @Column({length: 100, nullable: true})
    template: string;

}