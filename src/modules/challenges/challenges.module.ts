import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChallengesController } from './challenges.controller';
import { ChallengesService } from './challenges.service';
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
  ],
  controllers: [ChallengesController],
  providers: [ChallengesService],
  exports: [ChallengesService, TypeOrmModule],
})
export class ChallengesModule {}
