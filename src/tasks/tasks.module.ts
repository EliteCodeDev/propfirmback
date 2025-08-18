import { Module } from '@nestjs/common';
import { TasksService } from './tasks.service';
import { ActivateSmtApiJob } from './jobs/activate-smt-api.job';

@Module({
  providers: [TasksService],
  exports: [TasksService],
})
export class TasksModule {}
