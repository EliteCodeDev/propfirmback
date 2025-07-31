import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Verification } from './verification.entity';

@Entity('Media')
export class Media {
  @PrimaryGeneratedColumn('uuid')
  mediaID: string;

  @Column({ type: 'text' })
  url: string;

  @Column({ 
    type: 'enum',
    enum: ['image', 'video', 'document', 'other']
  })
  type: string;

  @CreateDateColumn()
  createdAt: Date;

  @Column({ type: 'char', length: 18, nullable: true })
  scope: string;

  @Column({ type: 'uuid', nullable: true })
  verificationID: string;

  // Relations
  @ManyToOne(() => Verification, verification => verification.media)
  @JoinColumn({ name: 'verificationID' })
  verification: Verification;
}