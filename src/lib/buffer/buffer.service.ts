import { Injectable, Logger } from '@nestjs/common';
import { MemoryBufferProvider } from './memory-buffer.provider';
import { Account } from 'src/common/utils/account';

@Injectable()
export class BufferService {
  private readonly logger = new Logger(BufferService.name);
  // Mutex por clave basado en una cola de promesas
  private readonly locks = new Map<string, Promise<void>>();
  constructor(private readonly provider: MemoryBufferProvider) {}

  async withLock<T>(key: string, fn: () => Promise<T> | T): Promise<T> {
    const prev = this.locks.get(key) ?? Promise.resolve();
    let release!: () => void;
    const next = new Promise<void>((res) => (release = res));
    // encadenar: el siguiente espera al anterior
    this.locks.set(
      key,
      prev.then(() => next),
    );
    // esperar turno
    await prev;
    try {
      return await fn();
    } finally {
      release();
      // cleanup si nadie más está encadenado aún
      const current = this.locks.get(key);
      // current siempre será prev.then(() => next) como mínimo; no podemos comparar funciones fácilmente
      // Dejar la entrada; se limpiará cuando el último release resuelva la cadena
      // Para evitar crecimiento, establecer una tarea de limpieza diferida
      current?.finally(() => {
        // si ya no hay más eslabones (el current terminó y no fue reemplazado por otro), eliminar
        if (this.locks.get(key) === current) this.locks.delete(key);
      });
    }
  }

  async upsertAccount(
    id: string,
    mutator: (prev: Account | undefined) => Account,
  ) {
    return this.withLock(id, async () => {
      this.logger.debug(`[upsertAccount] id=${id} INIT`);
      const before = this.provider.get(id);
      const updated = mutator(before);
      updated.lastUpdate = new Date();
      this.provider.set(id, updated);
      this.logger.debug(
        `[upsertAccount] id=${id} ${before ? 'UPDATED' : 'CREATED'} lastUpdate=${updated.lastUpdate.toISOString()}`,
      );
      return updated;
    });
  }

  async setAccount(id: string, value: Account) {
    return this.withLock(id, async () => {
      value.lastUpdate = new Date();
      this.provider.set(id, value);
    });
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

  /**
   * Obtiene todas las cuentas como array de objetos con id y account
   * Optimizado para procesamiento paralelo
   */
  async getAll() {
    const entries = this.provider.entries();
    const data = entries.map(([id, account]) => ({
      id,
      account,
    }));
    this.logger.debug(`[getAll] count=${data.length}`);
    return data;
  }

  /**
   * Procesa todas las cuentas en paralelo usando map + Promise.all
   * @param processor Función que procesa cada cuenta individualmente
   * @param options Opciones de procesamiento
   */
  async processAllParallel<T>(
    processor: (id: string, account: Account) => Promise<T>,
    options: { skipEmpty?: boolean; logErrors?: boolean } = {},
  ): Promise<Array<T | null>> {
    const { skipEmpty = true, logErrors = true } = options;
    const bufferSize = await this.size();

    if (bufferSize === 0) {
      this.logger.debug(
        '[processAllParallel] Buffer vacío, saltando procesamiento',
      );
      return [];
    }

    const entries = this.provider.entries();
    this.logger.debug(
      `[processAllParallel] Procesando ${entries.length} cuentas`,
    );

    const processes = entries.map(async ([id, account]) => {
      try {
        if (skipEmpty && !account) return null;
        return await processor(id, account);
      } catch (error) {
        if (logErrors) {
          this.logger.error(
            `[processAllParallel] Error procesando cuenta ${id}:`,
            error,
          );
        }
        return null;
      }
    });

    if (processes.length === 0) return [];

    const results = await Promise.all(processes);
    const successful = results.filter((r) => r !== null).length;
    const failed = results.length - successful;

    this.logger.debug(
      `[processAllParallel] Completado: exitosas=${successful}, fallidas=${failed}`,
    );

    return results;
  }

  /**
   * Filtra cuentas por una condición específica
   * @param predicate Función de filtrado
   */
  async filterAccounts(
    predicate: (id: string, account: Account) => boolean,
  ): Promise<Array<{ id: string; account: Account }>> {
    const entries = this.provider.entries();
    const filtered = entries
      .filter(([id, account]) => account && predicate(id, account))
      .map(([id, account]) => ({ id, account }));

    this.logger.debug(
      `[filterAccounts] Filtradas ${filtered.length} de ${entries.length} cuentas`,
    );
    return filtered;
  }

  /**
   * Obtiene estadísticas del buffer
   */
  // async getStats() {
  //   const entries = this.provider.entries();
  //   const total = entries.length;
  //   const withValidation = entries.filter(([, account]) =>
  //     account?.validation?.updatedAt
  //   ).length;
  //   const withBreaches = entries.filter(([, account]) =>
  //     account?.validation?.breaches?.length > 0
  //   ).length;

  //   return {
  //     total,
  //     withValidation,
  //     withBreaches,
  //     withoutValidation: total - withValidation
  //   };
  // }

  async keys() {
    return this.provider.keys();
  }

  async size() {
    return this.provider.size();
  }

  async delete(id: string) {
    return this.provider.delete(id);
  }

  /**
   * Limpia completamente el buffer
   */
  async clear() {
    if (this.provider.clear) {
      this.provider.clear();
      this.logger.warn('[clear] Buffer completamente limpiado');
    }
  }
}
