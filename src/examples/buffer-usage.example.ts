// import { Injectable, Logger } from '@nestjs/common';
// import { BufferService } from 'src/lib/buffer/buffer.service';
// import { Account } from 'src/common/utils/account';

// /**
//  * Ejemplo de uso del BufferService optimizado
//  * Demuestra cómo usar los nuevos métodos para procesamiento paralelo
//  * basado en el patrón de verifySession de scrap_metatrader
//  */
// @Injectable()
// export class BufferUsageExample {
//   private readonly logger = new Logger(BufferUsageExample.name);

//   constructor(private readonly buffer: BufferService) {}

//   /**
//    * Ejemplo 1: Procesamiento paralelo básico (similar a verifySession)
//    */
//   // async processAllAccountsParallel() {
//   //   // Verificar si hay datos
//   //   if ((await this.buffer.size()) === 0) {
//   //     this.logger.log('Buffer vacío');
//   //     return;
//   //   }

//   //   // Obtener todas las cuentas
//   //   const accounts = await this.buffer.getAll();
//   //   this.logger.log(`Procesando ${accounts.length} cuentas en paralelo`);

//   //   // Procesar en paralelo usando map + Promise.all (patrón de verifySession)
//   //   const results = await Promise.all(
//   //     accounts.map(async ({ id, account }) => {
//   //       try {
//   //         // Simular procesamiento de cuenta
//   //         const processed = await this.processAccount(account);

//   //         // Actualizar en buffer
//   //         await this.buffer.upsertAccount(id, () => processed);

//   //         return { id, success: true, processed: true };
//   //       } catch (error) {
//   //         this.logger.error(`Error procesando cuenta ${id}:`, error);
//   //         return { id, success: false, error: error.message };
//   //       }
//   //     }),
//   //   );

//   //   // Estadísticas
//   //   const successful = results.filter((r) => r.success).length;
//   //   this.logger.log(
//   //     `Procesamiento completado: ${successful}/${results.length} exitosos`,
//   //   );

//   //   return results;
//   // }

//   /**
//    * Ejemplo 2: Procesamiento con filtros
//    */
//   // async processFilteredAccounts() {
//   //   // Filtrar cuentas que necesitan procesamiento
//   //   const needsProcessing = await this.buffer.filterAccounts(
//   //     (account) =>
//   //       !account.validation ||
//   //       new Date().getTime() -
//   //         new Date(account.validation.updatedAt).getTime() >
//   //         60000,
//   //   );

//   //   this.logger.log(
//   //     `${needsProcessing.length} cuentas necesitan procesamiento`,
//   //   );

//   //   // Procesar solo las filtradas
//   //   const results = await Promise.all(
//   //     needsProcessing.map(async ({ id, value: account }) => {
//   //       const validation = {
//   //         updatedAt: new Date(),
//   //         breaches: await this.checkAccountBreaches(account),
//   //       };

//   //       await this.buffer.upsertAccount(id, (prev) => ({
//   //         ...prev,
//   //         validation,
//   //       }));

//   //       return { id, breaches: validation.breaches.length };
//   //     }),
//   //   );

//   //   return results;
//   // }

//   /**
//    * Ejemplo 3: Procesamiento por lotes
//    */
//   // async processBatches(batchSize: number = 10) {
//   //   const accounts = await this.buffer.getAll();
//   //   const batches = this.chunkArray(accounts, batchSize);

//   //   this.logger.log(
//   //     `Procesando ${accounts.length} cuentas en ${batches.length} lotes de ${batchSize}`,
//   //   );

//   //   for (let i = 0; i < batches.length; i++) {
//   //     const batch = batches[i];
//   //     this.logger.log(`Procesando lote ${i + 1}/${batches.length}`);

//   //     await Promise.all(
//   //       batch.map(async ({ id, account }) => {
//   //         const processed = await this.processAccount(account);
//   //         await this.buffer.upsertAccount(id, () => processed);
//   //       }),
//   //     );

//   //     // Pausa entre lotes para evitar sobrecarga
//   //     if (i < batches.length - 1) {
//   //       await this.sleep(100);
//   //     }
//   //   }
//   // }

//   /**
//    * Ejemplo 4: Estadísticas y monitoreo
//    */
//   // async getBufferAnalytics() {
//   //   // const stats = await this.buffer.getStats();
//   //   const accounts = await this.buffer.getAll();

//   //   // Análisis adicional
//   //   const accountsByStatus = accounts.reduce(
//   //     (acc, { value: account }) => {
//   //       const status =
//   //         account.validation?.breaches?.length > 0 ? 'breached' : 'clean';
//   //       acc[status] = (acc[status] || 0) + 1;
//   //       return acc;
//   //     },
//   //     {} as Record<string, number>,
//   //   );

//   //   const analytics = {
//   //     ...stats,
//   //     accountsByStatus,
//   //     lastUpdate: new Date(),
//   //     avgProcessingTime: this.calculateAvgProcessingTime(accounts),
//   //   };

//   //   this.logger.log('Buffer Analytics:', analytics);
//   //   return analytics;
//   // }

//   // Métodos auxiliares
//   // private async processAccount(account: Account): Promise<Account> {
//   //   // Simular procesamiento
//   //   await this.sleep(Math.random() * 100);

//   //   return {
//   //     ...account,
//   //     lastProcessed: new Date(),
//   //     processed: true,
//   //   };
//   // }

//   private async checkAccountBreaches(account: Account): Promise<string[]> {
//     const breaches: string[] = [];

//     // Ejemplo de validaciones
//     if (account.balance < 0) {
//       breaches.push('NEGATIVE_BALANCE');
//     }

//     if (account.equity && account.equity < account.balance * 0.8) {
//       breaches.push('HIGH_DRAWDOWN');
//     }

//     return breaches;
//   }

//   private chunkArray<T>(array: T[], size: number): T[][] {
//     const chunks: T[][] = [];
//     for (let i = 0; i < array.length; i += size) {
//       chunks.push(array.slice(i, i + size));
//     }
//     return chunks;
//   }

//   private sleep(ms: number): Promise<void> {
//     return new Promise((resolve) => setTimeout(resolve, ms));
//   }

//   // private calculateAvgProcessingTime(
//   //   accounts: Array<{ value: Account }>,
//   // ): number {
//   //   const processedAccounts = accounts.filter(
//   //     ({ value }) => value.lastProcessed,
//   //   );
//   //   if (processedAccounts.length === 0) return 0;

//   //   // Simulación - en un caso real calcularías el tiempo real
//   //   return Math.random() * 1000;
//   // }
// }
