import { Injectable, Logger } from '@nestjs/common';
import { MemoryBufferProvider } from './memory-buffer.provider';
import { Account } from '../common/utils/account';

@Injectable()
export class BufferService {
  private readonly logger = new Logger(BufferService.name);
  constructor(private readonly provider: MemoryBufferProvider) {}

  async upsertAccount(
    id: string,
    mutator: (prev: Account | undefined) => Account,
  ) {
    this.logger.debug(`[upsertAccount] id=${id} INIT`);
    const before = this.provider.get(id);
    const updated = mutator(before);
    updated.lastUpdate = new Date();
    this.provider.set(id, updated);
    this.logger.debug(
      `[upsertAccount] id=${id} ${before ? 'UPDATED' : 'CREATED'} lastUpdate=${updated.lastUpdate.toISOString()}`,
    );
    return updated;
  }

  async setAccount(id: string, value: Account) {
    value.lastUpdate = new Date();
    this.provider.set(id, value);
  }

  async getAccount(id: string) {
    const acc = this.provider.get(id);
    this.logger.debug(`[getAccount] id=${id} found=${!!acc}`);
    return acc;
  }

  async listEntries() {
    const entries = this.provider.entries();
    this.logger.debug(`[listEntries] count=${entries.length}`);
    return entries;
  }

  async keys() {
    return this.provider.keys();
  }

  async size() {
    return this.provider.size();
  }

  async delete(id: string) {
    return this.provider.delete(id);
  }
}
