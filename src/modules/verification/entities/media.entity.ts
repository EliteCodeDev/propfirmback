import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Verification } from './verification.entity';
import { MediaType } from 'src/common/enums/media-type.enum';

@Entity('Media')
export class Media {
  @PrimaryGeneratedColumn('uuid')
  mediaID: string;

  @Column({ type: 'text' })
  url: string;

  @Column({
    type: 'enum',
    enum: MediaType,
  })
  type: MediaType;

  @CreateDateColumn()
  createdAt: Date;

  @Column({ type: 'char', length: 18, nullable: true })
  scope: string;

  @Column({ type: 'uuid', nullable: true })
  verificationID: string;

  // Relations
  @ManyToOne(() => Verification, (verification) => verification.media)
  @JoinColumn({ name: 'verificationID' })
  verification: Verification;
}
