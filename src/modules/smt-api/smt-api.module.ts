import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { SmtApiService } from './smt-api.service';
import { SmtApiController } from './smt-api.controller';
import { ConfigModule } from '@nestjs/config';
import { smtApiConfig } from '../../config';
import { SmtApiClient } from './client/smt-api.client';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Challenge } from '../challenges/entities/challenge.entity';
import { ChallengeDetails } from '../challenges/entities/challenge-details.entity';
@Module({
  imports: [
    ConfigModule.forFeature(smtApiConfig),
    HttpModule,
    TypeOrmModule.forFeature([Challenge, ChallengeDetails]),
  ],
  controllers: [SmtApiController],
  providers: [SmtApiService, SmtApiClient],
  exports: [SmtApiService, SmtApiClient],
})
export class SmtApiModule {}
