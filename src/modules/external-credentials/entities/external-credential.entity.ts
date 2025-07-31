import { Entity, PrimaryColumn, Column, OneToOne, JoinColumn } from 'typeorm';
import { UserAccount } from '../../users/entities/user-account.entity';

@Entity('ExternalCredential')
export class ExternalCredential {
  @PrimaryColumn('uuid')
  userID: string;

  @Column({ type: 'char', length: 18, nullable: true })
  login: string;

  @Column({ type: 'char', length: 18, nullable: true })
  password: string;

  @Column({ type: 'char', length: 18, nullable: true })
  provider: string;

  @Column({ type: 'char', length: 18, nullable: true })
  documentId: string;

  // Relations
  @OneToOne(() => UserAccount)
  @JoinColumn({ name: 'userID' })
  user: UserAccount;
}