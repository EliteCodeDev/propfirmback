import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WithdrawalsController } from './withdrawals.controller';
import { WithdrawalsService } from './withdrawals.service';
import { Withdrawal } from './entities/withdrawal.entity';
import { ChallengesModule } from '../challenges/challenges.module';
import { CertificatesModule } from '../certificates/certificates.module';
import { ChallengeTemplatesModule } from '../challenge-templates/challenge-templates.module';
import { BrokerAccountsModule } from '../broker-accounts/broker-accounts.module';
import { MailerModule } from '../mailer/mailer.module';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    TypeOrmModule.forFeature([Withdrawal]),
    ChallengesModule,
    CertificatesModule,
    ChallengeTemplatesModule,
    BrokerAccountsModule,
    MailerModule,
    ConfigModule,
  ],
  controllers: [WithdrawalsController],
  providers: [WithdrawalsService],
  exports: [WithdrawalsService],
})
export class WithdrawalsModule {}