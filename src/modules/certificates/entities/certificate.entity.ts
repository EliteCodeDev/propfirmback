import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { UserAccount } from '../../users/entities/user-account.entity';
import { Challenge } from '../../challenges/entities/challenge.entity';
import { CertificateType } from 'src/common/enums/certificate-type.enum';
@Entity('Certificate')
export class Certificate {
  @PrimaryGeneratedColumn('uuid')
  certificateID: string;

  @Column({ type: 'uuid' })
  userID: string;

  @Column({ type: 'decimal', precision: 18, scale: 2, nullable: true })
  monto: number;

  @Column({ type: 'text', nullable: true })
  qrLink: string;

  @Column({ type: 'uuid' })
  challengeID: string;

  @Column({ length: 50 })
  type: CertificateType;

  @Column({ type: 'timestamp', nullable: true })
  certificateDate: Date;

  // Relations
  @ManyToOne(() => UserAccount, (user) => user.certificates)
  @JoinColumn({ name: 'userID' })
  user: UserAccount;

  @ManyToOne(() => Challenge, (challenge) => challenge.certificates)
  @JoinColumn({ name: 'challengeID' })
  challenge: Challenge;
}
