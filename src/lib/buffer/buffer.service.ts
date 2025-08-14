import { Injectable, Logger } from '@nestjs/common';
import { ClassBuffer } from './buffer';
import { Account } from 'src/common/utils/account';

@Injectable()
export class BufferService {
  
  constructor(private readonly provider: ClassBuffer) {}

  insertBuffer(key: string, value: Account): void {
    this.provider.set(key, value);
  }

  getBuffer(key: string): Account {
    return this.provider.get(key);
  }

  deleteBuffer(key: string): boolean {
    return this.provider.delete(key);
  }

  getSize(): number {
    return this.provider.getSize();
  }

  getAll(): Array<[string, Account]> {
    return this.provider.getAll();
  }

  clearBuffer(): void {
    this.provider.clear();
  }

}
