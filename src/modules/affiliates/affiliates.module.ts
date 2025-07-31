import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AffiliatesController } from './affiliates.controller';
import { AffiliatesService } from './affiliates.service';
import { Affiliate } from './entities/affiliate.entity';
import { UserAccount } from '../users/entities/user-account.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Affiliate, UserAccount]),
  ],
  controllers: [AffiliatesController],
  providers: [AffiliatesService],
  exports: [AffiliatesService],
})
export class AffiliatesModule {}