import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TasksService } from './tasks.service';
import {
  ActivateSmtApiJob,
  FlushBufferJob,
  RulesEvaluationJob,
  UpdateDailyBalanceJob,
} from './jobs';
import { BufferLoaderJob } from './jobs/buffer/buffer-loader.job';
import { BufferDataUpdaterJob } from './jobs/buffer-data-updater.job';
import { SmtApiModule } from 'src/modules';
import { BufferModule } from 'src/lib/buffer/buffer.module';
import { Challenge } from 'src/modules/challenges/entities/challenge.entity';
import { ChallengeRelation } from 'src/modules/challenge-templates/entities/challenge-relation.entity';
import { StageParameter } from 'src/modules/challenge-templates/entities/stage/stage-parameter.entity';
import { ChallengeTemplatesModule } from 'src/modules/challenge-templates/challenge-templates.module';
import { ChallengesModule } from 'src/modules/challenges/challenges.module';
import { MailerModule } from 'src/modules';
import { BrokeretApiJobsModule } from './jobs/brokeret-api/brokeret-api-jobs.module';
import { CustomLoggerService } from 'src/common/services/custom-logger.service';
import { WinstonModule } from 'nest-winston';
import { loggerConfig } from 'src/config/logger.config';
@Module({
  imports: [
    // SmtApiModule,
    BufferModule,
    ChallengeTemplatesModule,
    ChallengesModule,
    MailerModule,
    BrokeretApiJobsModule,
    TypeOrmModule.forFeature([Challenge, ChallengeRelation, StageParameter]),
    WinstonModule.forRootAsync({
      useFactory: () => loggerConfig(),
    }),
  ],
  providers: [
    TasksService,
    // ActivateSmtApiJob,
    BufferLoaderJob,
    FlushBufferJob,
    // RulesEvaluationJob,
    BufferDataUpdaterJob,
    UpdateDailyBalanceJob,
    CustomLoggerService,
  ],
  exports: [TasksService],
})
export class TasksModule {}
