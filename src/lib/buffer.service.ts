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
    const current = this.provider.get(id);
    const updated = mutator(current);
    updated.lastUpdate = new Date();
    this.provider.set(id, updated);
    return updated;
  }

  async setAccount(id: string, value: Account) {
    value.lastUpdate = new Date();
    this.provider.set(id, value);
  }

  async getAccount(id: string) {
    return this.provider.get(id);
  }

  async listEntries() {
    return this.provider.entries();
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
