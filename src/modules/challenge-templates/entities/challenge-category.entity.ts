import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { ChallengeRelation } from './challenge-relation.entity';

@Entity('ChallengeCategory')
export class ChallengeCategory {
  @PrimaryGeneratedColumn('uuid')
  categoryID: string;

  @Column({ length: 100, unique: true })
  name: string;

  // Relations
  @OneToMany(() => ChallengeRelation, (relation) => relation.category)
  relations: ChallengeRelation[];
}
