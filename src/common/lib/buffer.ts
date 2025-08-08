import { Injectable } from '@nestjs/common';
import { Account } from '../utils/account';
@Injectable() //una sola instancia del buffer estara en toda la aplicacion
export class ContextBuffer {
  private buffer: Map<string, Account> = new Map(); //login, objeto con infromacion

  public setBuffer(login: string, data: Account): void {
    this.buffer.set(login, data);
  }

  public getBuffer(login: string): Account | undefined {
    return this.buffer.get(login);
  }

  public has(login: string): boolean {
    return this.buffer.has(login);
  }

  public delete(login: string): void {
    this.buffer.delete(login);
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
