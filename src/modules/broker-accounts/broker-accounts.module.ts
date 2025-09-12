import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BrokerAccountsController } from './broker-accounts.controller';
import { BrokerAccountsService } from './broker-accounts.service';
import { BrokerAccount } from './entities/broker-account.entity';
import { ChallengesModule } from '../challenges/challenges.module';
import { UsersModule } from '../users/users.module';
import { ChallengeTemplatesModule } from '../challenge-templates/challenge-templates.module';
import { OrdersModule } from '../orders/orders.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([BrokerAccount]),
    forwardRef(() => ChallengesModule),
    forwardRef(() => OrdersModule),
    UsersModule,
    ChallengeTemplatesModule,
  ],
  controllers: [BrokerAccountsController],
  providers: [BrokerAccountsService],
  exports: [BrokerAccountsService],
})
export class BrokerAccountsModule {}
