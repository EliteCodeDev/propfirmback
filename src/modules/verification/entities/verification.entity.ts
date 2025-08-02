import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { UserAccount } from '../../users/entities/user-account.entity';
import { Media } from './media.entity';
import { VerificationStatus } from 'src/common/enums/verification-status.enum';
import { DocumentType } from 'src/common/enums/verification-document-type.enum';
@Entity('Verification')
export class Verification {
  @PrimaryGeneratedColumn('uuid')
  verificationID: string;

  @Column({ type: 'uuid' })
  userID: string;

  @Column({
    type: 'enum',
    enum: VerificationStatus,
    default: VerificationStatus.PENDING,
  })
  status: VerificationStatus;

  @Column({
    type: 'enum',
    enum: DocumentType,
  })
  documentType: DocumentType;

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
  @ManyToOne(() => UserAccount, (user) => user.verifications)
  @JoinColumn({ name: 'userID' })
  user: UserAccount;

  @OneToMany(() => Media, (media) => media.verification)
  media: Media[];
}
