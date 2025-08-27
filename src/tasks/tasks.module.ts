import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TasksService } from './tasks.service';
import { ActivateSmtApiJob, FlushBufferJob, RulesEvaluationJob } from './jobs';
import { BufferLoaderJob } from './jobs/buffer-loader.job';
import { SmtApiModule } from 'src/modules';
import { BufferModule } from 'src/lib/buffer/buffer.module';
import { Challenge } from 'src/modules/challenges/entities/challenge.entity';
import { ChallengeRelation } from 'src/modules/challenge-templates/entities/challenge-relation.entity';
import { StageParameter } from 'src/modules/challenge-templates/entities/stage/stage-parameter.entity';
import { ChallengeTemplatesModule } from 'src/modules/challenge-templates/challenge-templates.module';
import { ChallengesModule } from 'src/modules/challenges/challenges.module';
import { MailerModule } from 'src/modules';
import { BrokeretApiJobsModule } from './jobs/brokeret-api/brokeret-api-jobs.module';
@Module({
  imports: [
    SmtApiModule,
    BufferModule,
    ChallengeTemplatesModule,
    ChallengesModule,
    MailerModule,
    BrokeretApiJobsModule,
    TypeOrmModule.forFeature([Challenge, ChallengeRelation, StageParameter]),
  ],
  providers: [TasksService, ActivateSmtApiJob, BufferLoaderJob, FlushBufferJob, RulesEvaluationJob],
  exports: [TasksService],
})
export class TasksModule {}
