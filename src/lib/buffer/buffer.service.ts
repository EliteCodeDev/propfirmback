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
