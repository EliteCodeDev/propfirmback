import { Entity, PrimaryColumn, Column, OneToOne, JoinColumn } from 'typeorm';
import { UserAccount } from './user-account.entity';

@Entity('ExternalCredential')
export class ExternalCredential {
  @PrimaryColumn('uuid')
  userID: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  login: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  password: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  provider: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  documentId: string;

  // Relations
  @OneToOne(() => UserAccount)
  @JoinColumn({ name: 'userID' })
  user: UserAccount;
}
