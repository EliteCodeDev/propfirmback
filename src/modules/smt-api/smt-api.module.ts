import { Module } from '@nestjs/common';
import { SmtApiService } from './smt-api.service';
import { SmtApiController } from './smt-api.controller';
import { ConfigModule } from '@nestjs/config';
import { smtApiConfig } from '../../config';
import { VerifyAccountJob, RulesEvaluationJob, FlushBufferJob } from './jobs';
import { SmtApiClient } from './client/smt-api.client';
@Module({
  imports: [ConfigModule.forFeature(smtApiConfig)],
  controllers: [SmtApiController],
  providers: [
    SmtApiService,
    VerifyAccountJob,
    RulesEvaluationJob,
    FlushBufferJob,
    SmtApiClient,
  ],
  exports: [SmtApiService, SmtApiClient],
})
export class SmtApiModule {}
