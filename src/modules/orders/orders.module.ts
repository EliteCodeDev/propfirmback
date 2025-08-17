import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { CustomerOrder } from './entities/customer-order.entity';
import { MailerModule } from '../mailer/mailer.module';
import { UsersModule } from '../users/users.module';
import { ChallengesModule } from '../challenges/challenges.module';
import { BrokerAccountsModule } from '../broker-accounts/broker-accounts.module';
import { ChallengeTemplatesModule } from '../challenge-templates/challenge-templates.module';
@Module({
  imports: [
    TypeOrmModule.forFeature([CustomerOrder]),
    MailerModule,
    UsersModule,
    ChallengesModule,
    BrokerAccountsModule,
    ChallengeTemplatesModule,
  ],
  controllers: [OrdersController],
  providers: [OrdersService],
  exports: [OrdersService],
})
export class OrdersModule {}
