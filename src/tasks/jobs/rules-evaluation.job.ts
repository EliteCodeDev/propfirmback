import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { BufferService } from 'src/lib/buffer/buffer.service';

@Injectable()
export class RulesEvaluationJob {
  private readonly logger = new Logger(RulesEvaluationJob.name);

  constructor(private readonly buffer: BufferService) {}

  @Cron(CronExpression.EVERY_MINUTE)
  async evaluate() {
    const entries = await this.buffer.listEntries();
    let processed = 0;
    for (const [id, account] of entries) {
      if (!account) continue;
      (account as any).validation = { updatedAt: new Date(), breaches: [] };
      await this.buffer.upsertAccount(id, () => account);
      processed++;
    }
    this.logger.debug(`RulesEvaluationJob procesó ${processed} cuentas`);
  }
}
