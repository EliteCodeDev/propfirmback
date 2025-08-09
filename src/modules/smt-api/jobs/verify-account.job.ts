import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class VerifyAccountJob {
  private readonly logger = new Logger(VerifyAccountJob.name);

  @Cron('* * * * * *')
  handleCron() {
    this.logger.debug('Called when the current second is 0');
  }
}
