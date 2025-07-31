import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { UserAccount } from '../../users/entities/user-account.entity';
import { Media } from './media.entity';

@Entity('Verification')
export class Verification {
  @PrimaryGeneratedColumn('uuid')
  verificationID: string;

  @Column({ type: 'uuid' })
  userId: string;

  @Column({ 
    type: 'enum',
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  })
  status: string;

  @Column({ 
    type: 'enum',
    enum: ['dni', 'passport', 'driver_license', 'other']
  })
  documentType: string;

  @Column({ length: 100, nullable: true })
  numDocument: string;

  @Column({ length: 255, nullable: true })
  rejectionReason: string;

  @CreateDateColumn()
  submittedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  approvedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  rejectedAt: Date;

  // Relations
  @ManyToOne(() => UserAccount, user => user.verifications)
  @JoinColumn({ name: 'userId' })
  user: UserAccount;

  @OneToMany(() => Media, media => media.verification)
  media: Media[];
}