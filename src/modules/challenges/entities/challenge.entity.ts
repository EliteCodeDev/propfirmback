import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { UserAccount } from '../../users/entities/user-account.entity';
import { ChallengeRelation } from 'src/modules/challenge-templates/entities/challenge-relation.entity';
import { BrokerAccount } from '../../broker-accounts/entities/broker-account.entity';
import { ChallengeDetails } from './challenge-details.entity';
import { Certificate } from '../../certificates/entities/certificate.entity';
import { CustomerOrder } from '../../orders/entities/customer-order.entity';
import { Withdrawal } from '../../withdrawals/entities/withdrawal.entity';
import { ChallengeStatus } from 'src/common/enums/challenge-status.enum';
@Entity('Challenge')
export class Challenge {
  @PrimaryGeneratedColumn('uuid')
  challengeID: string;

  @Column({ type: 'uuid' })
  userID: string;

  @Column({ type: 'uuid', nullable: true })
  relationID: string;

  @Column({ type: 'datetime', nullable: true })
  startDate: Date;

  @Column({ type: 'datetime', nullable: true })
  endDate: Date;

  @Column({ type: 'int', nullable: true })
  numPhase: number;

  @Column({ type: 'decimal', precision: 18, scale: 2, nullable: true })
  dynamicBalance: number;

  @Column({
    type: 'varchar',
    enum: ChallengeStatus,
    default: ChallengeStatus.INNITIAL,
    nullable: true,
  })
  status: ChallengeStatus; // ← aquí no hay ningún `length`

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @Column({ type: 'uuid', nullable: true })
  parentID: string;

  @Column({ type: 'uuid', nullable: true })
  brokerAccountID: string;

  // Relaciones
  @ManyToOne(() => UserAccount, (user) => user.challenges)
  @JoinColumn({ name: 'userID' })
  user: UserAccount;

  @ManyToOne(() => ChallengeRelation, (relation) => relation.challenges)
  @JoinColumn({ name: 'relationID' })
  relation: ChallengeRelation;

  @ManyToOne(() => Challenge, (challenge) => challenge.children)
  @JoinColumn({ name: 'parentID' })
  parent: Challenge;

  @OneToMany(() => Challenge, (challenge) => challenge.parent)
  children: Challenge[];

  @ManyToOne(() => BrokerAccount, (account) => account.challenges)
  @JoinColumn({ name: 'brokerAccountID' })
  brokerAccount: BrokerAccount;

  @OneToOne(() => ChallengeDetails, (details) => details.challenge)
  details: ChallengeDetails;

  @OneToMany(() => Certificate, (certificate) => certificate.challenge)
  certificates: Certificate[];

  @OneToMany(() => CustomerOrder, (order) => order.challenge)
  orders: CustomerOrder[];

  @OneToMany(() => Withdrawal, (withdrawal) => withdrawal.challenge)
  withdrawals: Withdrawal[];
}
