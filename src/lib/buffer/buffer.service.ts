import { Injectable, Logger } from '@nestjs/common';
import { ClassBuffer } from './buffer';
import { BufferMutexService } from './buffer-mutex.service';
import { Account } from 'src/common/utils/account';

export interface ProcessOptions {
  skipEmpty?: boolean;
  logErrors?: boolean;
  maxConcurrency?: number;
}

export interface ProcessResult<T> {
  id: string;
  result: T | null;
  error?: Error;
}

@Injectable()
export class BufferService {
  private readonly logger = new Logger(BufferService.name);

  constructor(
    private readonly provider: ClassBuffer,
    private readonly mutexService: BufferMutexService,
  ) {}

  // Métodos originales (mantener compatibilidad)
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

  // Nuevos métodos thread-safe

  /**
   * Ejecuta una operación con lock exclusivo para una clave específica
   */
  async withLock<T>(
    key: string,
    fn: (account?: Account) => Promise<T> | T,
  ): Promise<T> {
    return await this.mutexService.withLock(key, async () => {
      const account = this.provider.get(key);
      return await fn(account);
    });
  }

  /**
   * Obtiene un snapshot inmutable de una cuenta
   */
  async getSnapshot(key: string): Promise<Account | null> {
    return await this.mutexService.withLock(key, () => {
      const account = this.provider.get(key);
      return account ? this.createSnapshot(account) : null;
    });
  }

  /**
   * Actualiza o inserta una cuenta de forma thread-safe
   */
  async upsertAccount(
    key: string,
    updater: (prev?: Account) => Account,
  ): Promise<Account> {
    return await this.mutexService.withLock(key, () => {
      const current = this.provider.get(key);
      const updated = updater(current);
      this.provider.set(key, updated);
      return this.createSnapshot(updated);
    });
  }

  /**
   * Elimina una cuenta de forma thread-safe
   */
  async deleteAccount(key: string): Promise<boolean> {
    return await this.mutexService.withLock(key, () => {
      return this.provider.delete(key);
    });
  }

  /**
   * Lista todas las entradas del buffer de forma thread-safe
   */
  async listEntries(): Promise<Array<[string, Account]>> {
    const entries = this.provider.getAll();
    return entries.map(([key, account]) => [key, this.createSnapshot(account)]);
  }

  /**
   * Procesa todas las cuentas en paralelo de forma thread-safe
   */
  async processAllParallel<T>(
    processor: (id: string, account: Account) => Promise<T> | T,
    options: ProcessOptions = {},
  ): Promise<ProcessResult<T>[]> {
    const { skipEmpty = true, logErrors = true, maxConcurrency = 10 } = options;

    const entries = this.provider.getAll();
    const results: ProcessResult<T>[] = [];

    // Procesar en lotes para controlar la concurrencia
    for (let i = 0; i < entries.length; i += maxConcurrency) {
      const batch = entries.slice(i, i + maxConcurrency);

      const batchPromises = batch.map(
        async ([id, account]): Promise<ProcessResult<T>> => {
          try {
            if (skipEmpty && !account) {
              return { id, result: null };
            }

            const snapshot = this.createSnapshot(account);
            const result = await processor(id, snapshot);

            return { id, result };
          } catch (error) {
            const err =
              error instanceof Error ? error : new Error(String(error));

            if (logErrors) {
              this.logger.error(
                `Error procesando cuenta ${id}: ${err.message}`,
                err.stack,
              );
            }

            return { id, result: null, error: err };
          }
        },
      );

      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);
    }

    return results;
  }

  /**
   * Verifica si una clave tiene un lock activo
   */
  isLocked(key: string): boolean {
    return this.mutexService.isLocked(key);
  }

  /**
   * Obtiene estadísticas del buffer y mutex
   */
  getStats(): {
    bufferSize: number;
    mutexStats: { totalMutex: number; activeLocks: number };
  } {
    return {
      bufferSize: this.provider.getSize(),
      mutexStats: this.mutexService.getPoolStats(),
    };
  }

  /**
   * Crea un snapshot inmutable de una cuenta
   */
  private createSnapshot(account: Account): Account {
    return JSON.parse(JSON.stringify(account));
  }
}
