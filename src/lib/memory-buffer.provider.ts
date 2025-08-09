import { Injectable } from '@nestjs/common';
import { BufferProvider } from './buffer.interface';
import { Account } from '../common/utils/account';

@Injectable()
export class MemoryBufferProvider implements BufferProvider<Account> {
  private store = new Map<string, Account>();

  set(key: string, value: Account) {
    this.store.set(key, value);
  }
  get(key: string) {
    return this.store.get(key);
  }
  has(key: string) {
    return this.store.has(key);
  }
  delete(key: string) {
    this.store.delete(key);
  }
  clear() {
    this.store.clear();
  }
  keys() {
    return Array.from(this.store.keys());
  }
  entries() {
    return Array.from(this.store.entries());
  }
  size() {
    return this.store.size;
  }
}
