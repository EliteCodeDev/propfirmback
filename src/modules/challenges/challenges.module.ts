import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChallengesController } from './controllers/challenges.controller';
import { ChallengesService } from './services/challenges.service';
import { ChallengeDetailsController } from './controllers/challenge-details.controller';
import { ChallengeDetailsService } from './services/challenge-details.service';
import { Challenge } from './entities/challenge.entity';
import { ChallengeDetails } from './entities/challenge-details.entity';
import { UserAccount } from '../users/entities/user-account.entity';
import { ChallengeTemplatesModule } from '../challenge-templates/challenge-templates.module';
import { VerificationModule } from '../verification/verification.module';
import { CertificatesModule } from '../certificates/certificates.module';
import { BrokerAccountsModule } from '../broker-accounts/broker-accounts.module';
import { MailerModule } from '../mailer/mailer.module';
import { BufferModule } from 'src/lib/buffer/buffer.module';
import { ConfigModule } from '@nestjs/config';
import { StylesModule } from '../styles/styles.module';
import { OrdersModule } from '../orders/orders.module';
import { BrokeretApiModule } from '../data/brokeret-api/brokeret-api.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Challenge, ChallengeDetails, UserAccount]),
    ChallengeTemplatesModule,
    VerificationModule,
    CertificatesModule,
    BrokerAccountsModule,
    MailerModule,
    BufferModule,
    ConfigModule,
    StylesModule,
    forwardRef(() => OrdersModule),
    BrokeretApiModule,
  ],
  controllers: [ChallengesController, ChallengeDetailsController],
  providers: [ChallengesService, ChallengeDetailsService],
  exports: [ChallengesService, ChallengeDetailsService, TypeOrmModule],
})
export class ChallengesModule {}
