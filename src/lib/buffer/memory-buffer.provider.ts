import { Injectable, Logger } from '@nestjs/common';
import { BufferProvider } from './buffer.interface';
import { Account } from 'src/common/utils/account';

@Injectable()
export class MemoryBufferProvider implements BufferProvider<Account> {
  private store = new Map<string, Account>();
  private readonly logger = new Logger(MemoryBufferProvider.name);

  set(key: string, value: Account) {
    this.logger.debug(`[set] key=${key}`);
    this.store.set(key, value);
  }
  get(key: string) {
    const hit = this.store.has(key);
    this.logger.debug(`[get] key=${key} hit=${hit}`);
    return this.store.get(key);
  }
  has(key: string) {
    return this.store.has(key);
  }
  delete(key: string) {
    this.logger.debug(`[delete] key=${key}`);
    this.store.delete(key);
  }
  clear() {
    this.logger.warn('[clear] full buffer cleared');
    this.store.clear();
  }
  keys() {
    return Array.from(this.store.keys());
  }
  entries() {
    this.logger.debug(`[entries] size=${this.store.size}`);
    return Array.from(this.store.entries());
  }
  size() {
    return this.store.size;
  }
}
