import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { UserAccount } from '../users/entities/user-account.entity';
import { CustomerOrder } from '../orders/entities/customer-order.entity';
import { Withdrawal } from '../withdrawals/entities/withdrawal.entity';
import { ChallengePlan } from '../challenge-templates/entities/challenge-plan.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      UserAccount,
      CustomerOrder,
      Withdrawal,
      ChallengePlan
    ])
  ],
  controllers: [DashboardController],
  providers: [DashboardService],
  exports: [DashboardService]
})
export class DashboardModule {}