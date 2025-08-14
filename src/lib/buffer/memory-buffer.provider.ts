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
  
  /**
   * Obtiene todas las entradas como array de objetos {id, value}
   * Optimizado para procesamiento paralelo
   */
  getAll() {
    const data = [];
    for (const [key, value] of this.store.entries()) {
      data.push({
        id: key,
        value: value
      });
    }
    this.logger.debug(`[getAll] count=${data.length}`);
    return data;
  }
  
  /**
   * Filtra entradas basado en un predicado
   */
  filter(predicate: (key: string, value: Account) => boolean): Array<[string, Account]> {
    const filtered = Array.from(this.store.entries())
      .filter(([key, value]) => predicate(key, value));
    this.logger.debug(`[filter] filtered=${filtered.length} from=${this.store.size}`);
    return filtered;
  }
  
  /**
   * Verifica si el buffer está vacío
   */
  isEmpty(): boolean {
    return this.store.size === 0;
  }
  
  /**
   * Obtiene múltiples valores por sus claves
   */
  getMultiple(keys: string[]): Array<Account | undefined> {
    const results = keys.map(key => this.store.get(key));
    const found = results.filter(r => r !== undefined).length;
    this.logger.debug(`[getMultiple] requested=${keys.length} found=${found}`);
    return results;
  }
  
  size() {
    return this.store.size;
  }
}
