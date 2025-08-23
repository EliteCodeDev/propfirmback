import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { SmtApiService } from './smt-api.service';
import { SmtApiController } from './smt-api.controller';
import { ConfigModule } from '@nestjs/config';
import { smtApiConfig } from 'src/config';
import { SmtApiClient } from './client/smt-api.client';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Challenge } from 'src/modules/challenges/entities/challenge.entity';
import { ChallengeDetails } from 'src/modules/challenges/entities/challenge-details.entity';
import { AccountDataTransformPipe } from './pipes/account-data-transform.pipe';
@Module({
  imports: [
    ConfigModule.forFeature(smtApiConfig),
    HttpModule,
    TypeOrmModule.forFeature([Challenge, ChallengeDetails]),
  ],
  controllers: [SmtApiController],
  providers: [SmtApiService, SmtApiClient, AccountDataTransformPipe],
  exports: [SmtApiService, SmtApiClient],
})
export class SmtApiModule {}
