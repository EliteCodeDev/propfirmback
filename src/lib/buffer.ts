import { Injectable } from '@nestjs/common';
import { Account } from '../common/utils/account';
@Injectable() //una sola instancia del buffer estara en toda la aplicacion
export class ContextBuffer {
  private buffer: Map<string, Account> = new Map(); //login, objeto con infromacion

  public setBuffer(brokerAccountID: string, data: Account): void {
    this.buffer.set(brokerAccountID, data);
  }

  public getBuffer(brokerAccountID: string): Account | undefined {
    return this.buffer.get(brokerAccountID);
  }

  public has(brokerAccountID: string): boolean {
    return this.buffer.has(brokerAccountID);
  }

  public delete(brokerAccountID: string): void {
    this.buffer.delete(brokerAccountID);
  }

  public clear(): void {
    this.buffer.clear();
  }

  public getAllBuffers(): Record<string, Account> {
    const obj: Record<string, Account> = {};
    for (const [key, value] of this.buffer.entries()) {
      obj[key] = value;
    }
    return obj;
  }

  public getLength(): number {
    return this.buffer.size;
  }
}
