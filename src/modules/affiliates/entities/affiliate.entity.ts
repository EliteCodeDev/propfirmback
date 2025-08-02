import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { UserAccount } from '../../users/entities/user-account.entity';
import { AffiliateStatus } from 'src/common/enums/affiliate-status.enum';

@Entity('Affiliate')
export class Affiliate {
  @PrimaryGeneratedColumn('uuid')
  afiliateID: string;

  @Column({ length: 50, unique: true })
  referralCode: string;

  @Column({ type: 'uuid', nullable: true })
  parentAffiliateId: string;

  @Column({ type: 'int', default: 1 })
  level: number;

  @Column({
    type: 'enum',
    enum: AffiliateStatus,
    default: AffiliateStatus.ACTIVE,
  })
  status: AffiliateStatus;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ type: 'char', length: 18, nullable: true })
  referralUrl: string;

  @Column({ type: 'decimal', precision: 6, scale: 2 })
  commissionRate: number;

  @Column({ type: 'uuid', nullable: true })
  userID: string;

  // Relations
  @ManyToOne(() => Affiliate, (affiliate) => affiliate.childAffiliates)
  @JoinColumn({ name: 'parentAffiliateId' })
  parentAffiliate: Affiliate;

  @OneToMany(() => Affiliate, (affiliate) => affiliate.parentAffiliate)
  childAffiliates: Affiliate[];

  @OneToOne(() => UserAccount, (user) => user.referralAffiliate)
  @JoinColumn({ name: 'userID' })
  user: UserAccount;

  @OneToMany(() => UserAccount, (user) => user.referralAffiliate)
  users: UserAccount[];
}
