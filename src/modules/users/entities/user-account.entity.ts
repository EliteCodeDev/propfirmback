import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  OneToOne,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Exclude } from 'class-transformer';
import { UserRole } from './user-role.entity';
import { Address } from './address.entity';
import { Affiliate } from '../../affiliates/entities/affiliate.entity';
import { Challenge } from '../../challenges/entities/challenge.entity';
import { Verification } from '../../verification/entities/verification.entity';
import { Withdrawal } from '../../withdrawals/entities/withdrawal.entity';
import { CustomerOrder } from '../../orders/entities/customer-order.entity';
import { Certificate } from '../../certificates/entities/certificate.entity';

@Entity('UserAccount')
export class UserAccount {
  @PrimaryGeneratedColumn('uuid')
  userID: string;

  @Column({ length: 100, unique: true })
  username: string;

  @Column({ length: 150, unique: true })
  email: string;

  @Column({ type: 'text' })
  @Exclude()
  passwordHash: string;

  @Column({ length: 100, nullable: true })
  firstName?: string;

  @Column({ length: 100, nullable: true })
  lastName?: string;

  @Column({ length: 255, nullable: true })
  @Exclude()
  resetPasswordToken?: string;

  @Column({ length: 255, nullable: true })
  @Exclude()
  confirmationToken?: string;

  @Column({ type: 'boolean', default: false })
  isConfirmed: boolean;

  @Column({ type: 'boolean', default: false })
  isBlocked: boolean;

  @Column({ type: 'boolean', default: false })
  isVerified: boolean;

  @Column({ length: 30, nullable: true })
  phone?: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Ahora opcional: puede ser NULL si no viene referralCode
  @Column({ type: 'uuid', nullable: true })
  refAfiliateID?: string;

  // Relaciones
  @OneToMany(() => UserRole, userRole => userRole.user)
  userRoles: UserRole[];

  @OneToOne(() => Address, address => address.user)
  address: Address;

  @ManyToOne(() => Affiliate, affiliate => affiliate.users, { nullable: true })
  @JoinColumn({ name: 'refAfiliateID' })
  referralAffiliate?: Affiliate;

  @OneToMany(() => Challenge, challenge => challenge.user)
  challenges: Challenge[];

  @OneToMany(() => Verification, verification => verification.user)
  verifications: Verification[];

  @OneToMany(() => Withdrawal, withdrawal => withdrawal.user)
  withdrawals: Withdrawal[];

  @OneToMany(() => CustomerOrder, order => order.user)
  orders: CustomerOrder[];

  @OneToMany(() => Certificate, certificate => certificate.user)
  certificates: Certificate[];
}
