import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { SmtApiService } from './smt-api.service';
import { SmtApiController } from './smt-api.controller';
import { ConfigModule } from '@nestjs/config';
import { smtApiConfig } from '../../config';
import { VerifyAccountJob, RulesEvaluationJob, FlushBufferJob } from './jobs';
import { SmtApiClient } from './client/smt-api.client';
@Module({
  imports: [ConfigModule.forFeature(smtApiConfig), HttpModule],
  controllers: [SmtApiController],
  providers: [SmtApiService, RulesEvaluationJob, FlushBufferJob, SmtApiClient],
  exports: [SmtApiService, SmtApiClient],
})
export class SmtApiModule {}
