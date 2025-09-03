import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { CustomerOrder } from './entities/customer-order.entity';
import { MailerModule } from '../mailer/mailer.module';
import { UsersModule } from '../users/users.module';
import { ChallengesModule } from '../challenges/challenges.module';
import { BrokerAccountsModule } from '../broker-accounts/broker-accounts.module';
import { ChallengeTemplatesModule } from '../challenge-templates/challenge-templates.module';
import { SmtApiModule } from 'src/modules/data/smt-api/smt-api.module';
import { BrokeretApiModule } from '../data/brokeret-api/brokeret-api.module';
import { BufferModule } from 'src/lib/buffer/buffer.module';
import { UserAccount } from '../users/entities';
@Module({
  imports: [
    TypeOrmModule.forFeature([CustomerOrder]),
    MailerModule,
    UsersModule,
    forwardRef(() => ChallengesModule),
    BrokerAccountsModule,
    ChallengeTemplatesModule,
    SmtApiModule,
    BrokeretApiModule,
    BufferModule,
  ],
  controllers: [OrdersController],
  providers: [OrdersService],
  exports: [OrdersService],
})
export class OrdersModule {}
