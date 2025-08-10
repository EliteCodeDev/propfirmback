import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { BufferService } from 'src/lib/buffer/buffer.service';

@Injectable()
export class FlushBufferJob {
  private readonly logger = new Logger(FlushBufferJob.name);
  constructor(private readonly buffer: BufferService) {}

  // Segundo 0 de cada décimo minuto
  @Cron('0 0/10 * * * *')
  async flush() {
    const entries = await this.buffer.listEntries();
    const total = entries.length;
    // TODO: persistir batch en BD
    this.logger.debug(
      `FlushBufferJob: (mock) se persistirían ${total} cuentas`,
    );
  }
}
