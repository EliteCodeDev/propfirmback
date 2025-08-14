import { Injectable, Logger } from '@nestjs/common';
import { Account } from 'src/common/utils/account';

@Injectable()
export class ClassBuffer {
  private buffer: Map<string, Account>

  constructor() {
    this.buffer = new Map<string, Account>()
  }

  set(key: string, value: Account) {
    this.buffer.set(key, value)
  }

  get(key: string): Account {
    return this.buffer.get(key)
  }

  delete(key: string): boolean {
    return this.buffer.delete(key)
  }

  getSize(): number {
    return this.buffer.size
  }

  getAll(): Array<[string, Account]> {
    return Array.from(this.buffer.entries())
  }

  clear() {
    this.buffer.clear()
  }

  has(key: string): boolean {
    return this.buffer.has(key)
  }

}
