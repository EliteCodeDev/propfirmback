import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BrokerAccountsController } from './broker-accounts.controller';
import { BrokerAccountsService } from './broker-accounts.service';
import { BrokerAccount } from './entities/broker-account.entity';

@Module({
  imports: [TypeOrmModule.forFeature([BrokerAccount])],
  controllers: [BrokerAccountsController],
  providers: [BrokerAccountsService],
  exports: [BrokerAccountsService],
})
export class BrokerAccountsModule {}