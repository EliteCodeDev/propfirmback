import { Injectable, Logger } from '@nestjs/common';
import { Mutex } from 'async-mutex';

@Injectable()
export class BufferMutexService {
  private readonly logger = new Logger(BufferMutexService.name);
  private readonly mutexPool = new Map<string, Mutex>();
  private readonly maxPoolSize = 1000; // Límite para evitar memory leaks

  /**
   * Obtiene o crea un mutex para una clave específica
   */
  private getMutex(key: string): Mutex {
    if (!this.mutexPool.has(key)) {
      // Verificar límite del pool
      if (this.mutexPool.size >= this.maxPoolSize) {
        this.logger.warn(
          `BufferMutexService: Pool de mutex alcanzó el límite (${this.maxPoolSize}). Limpiando mutex no utilizados.`,
        );
        this.cleanupUnusedMutex();
      }

      this.mutexPool.set(key, new Mutex());
      this.logger.debug(`BufferMutexService: Creado nuevo mutex para key=${key}`);
    }

    return this.mutexPool.get(key)!;
  }

  /**
   * Ejecuta una función con lock exclusivo para una clave específica
   */
  async withLock<T>(key: string, fn: () => Promise<T> | T): Promise<T> {
    const mutex = this.getMutex(key);
    
    return await mutex.runExclusive(async () => {
      this.logger.debug(`BufferMutexService: Ejecutando con lock para key=${key}`);
      try {
        const result = await fn();
        this.logger.debug(`BufferMutexService: Operación completada para key=${key}`);
        return result;
      } catch (error) {
        this.logger.error(
          `BufferMutexService: Error en operación con lock para key=${key}: ${error?.message || error}`,
        );
        throw error;
      }
    });
  }

  /**
   * Verifica si una clave tiene un lock activo
   */
  isLocked(key: string): boolean {
    const mutex = this.mutexPool.get(key);
    return mutex ? mutex.isLocked() : false;
  }

  /**
   * Obtiene estadísticas del pool de mutex
   */
  getPoolStats(): { totalMutex: number; activeLocks: number } {
    const totalMutex = this.mutexPool.size;
    const activeLocks = Array.from(this.mutexPool.values()).filter(
      (mutex) => mutex.isLocked(),
    ).length;

    return { totalMutex, activeLocks };
  }

  /**
   * Limpia mutex que no están siendo utilizados
   */
  private cleanupUnusedMutex(): void {
    const keysToRemove: string[] = [];

    for (const [key, mutex] of this.mutexPool.entries()) {
      if (!mutex.isLocked()) {
        keysToRemove.push(key);
      }
    }

    // Remover hasta la mitad de los mutex no utilizados
    const toRemove = keysToRemove.slice(0, Math.ceil(keysToRemove.length / 2));
    toRemove.forEach((key) => {
      this.mutexPool.delete(key);
    });

    this.logger.debug(
      `BufferMutexService: Limpiados ${toRemove.length} mutex no utilizados`,
    );
  }

  /**
   * Fuerza la limpieza de todos los mutex no bloqueados
   */
  forceCleanup(): void {
    const initialSize = this.mutexPool.size;
    
    for (const [key, mutex] of this.mutexPool.entries()) {
      if (!mutex.isLocked()) {
        this.mutexPool.delete(key);
      }
    }

    const finalSize = this.mutexPool.size;
    this.logger.log(
      `BufferMutexService: Limpieza forzada completada. Mutex removidos: ${initialSize - finalSize}`,
    );
  }
}