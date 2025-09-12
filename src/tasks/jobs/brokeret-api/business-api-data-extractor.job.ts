// import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
// // import { Cron } from '@nestjs/schedule';
// import { CreationFazoClient } from 'src/modules/data/brokeret-api/client/creation-fazo.client';
// import { BufferService } from 'src/lib/buffer/buffer.service';
// import { Account } from 'src/common/utils/account';
// import { BrokeretDataMapper } from './mappers/brokeret-data.mapper';
// import { CustomLoggerService } from 'src/common/services/custom-logger.service';

// @Injectable()
// export class BusinessDataExtractorJob implements OnModuleInit {
//   private readonly logger = new Logger(BusinessDataExtractorJob.name);

//   constructor(
//     private readonly fazoClient: CreationFazoClient,
//     private readonly buffer: BufferService,
//     private readonly dataMapper: BrokeretDataMapper,
//     private readonly customLogger: CustomLoggerService,
//   ) {}

//   onModuleInit() {
//     this.logger.log('BusinessDataExtractorJob inicializado');
//     // No ejecutar al inicio - solo cuando haya datos en el buffer
//     this.logger.debug(
//       'Job configurado para ejecutarse cada 3 minutos cuando haya cuentas en el buffer',
//     );
//   }

//   // Método removido - ahora es llamado por BufferDataUpdaterJob
//   // El decorador @Cron fue movido al BufferDataUpdaterJob centralizado

//   /**
//    * Proceso principal de extracción de datos (público para ser llamado por BufferDataUpdaterJob)
//    */
//   async extractBrokeretDataProcess() {
//     const startTime = Date.now();

//     this.customLogger.logJob({
//       jobName: 'BusinessDataExtractorJob',
//       operation: 'extract_data_start',
//       status: 'started',
//       details: {},
//     });

//     try {
//       // Obtener estadísticas del buffer para verificar si hay cuentas
//       const stats = this.buffer.getStats();

//       //si se llama a la función, naturalemte hay cuentas en el buffer
//       // if (stats.bufferSize === 0) {
//       //   this.logger.debug('No hay cuentas en el buffer para procesar');

//       //   this.customLogger.logJob({
//       //     jobName: 'BusinessDataExtractorJob',
//       //     operation: 'extract_data_empty',
//       //     status: 'completed',
//       //     details: {
//       //       buffer_size: 0,
//       //       duration_ms: Date.now() - startTime,
//       //     },
//       //   });
//       //   return;
//       // }

//       this.logger.debug(
//         `BusinessDataExtractorJob: Procesando ${stats.bufferSize} cuentas del buffer`,
//       );

//       this.customLogger.logJob({
//         jobName: 'BusinessDataExtractorJob',
//         operation: 'extract_data_processing',
//         status: 'in_progress',
//         details: { buffer_size: stats.bufferSize },
//       });

//       // Usar processAllParallel para procesamiento thread-safe y paralelo
//       const results = await this.buffer.processAllParallel(
//         async (login: string, account: Account) => {
//           return await this.processAccountDataThreadSafe(login, account);
//         },
//         {
//           skipEmpty: true,
//           logErrors: true,
//           maxConcurrency: 5, // Limitar concurrencia para evitar sobrecarga de la API
//         },
//       );

//       // Contar resultados
//       const processedCount = results.filter(
//         (r) => r.result !== null && !r.error,
//       ).length;
//       const errorCount = results.filter((r) => r.error).length;

//       this.logger.debug(
//         `BusinessDataExtractorJob: ${processedCount}/${results.length} cuentas procesadas exitosamente, ${errorCount} errores`,
//       );

//       // Log del estado actual del buffer
//       this.logger.debug(
//         `BusinessDataExtractorJob: Estado del buffer: ${JSON.stringify(
//           this.buffer.getStats(),
//         )}`,
//       );

//       const duration = Date.now() - startTime;

//       this.customLogger.logJob({
//         jobName: 'BusinessDataExtractorJob',
//         operation: 'extract_data_success',
//         status: 'completed',
//         details: {
//           duration_ms: duration,
//           total_accounts: results.length,
//           processed_count: processedCount,
//           error_count: errorCount,
//           buffer_size: stats.bufferSize,
//         },
//       });
//     } catch (error) {
//       const duration = Date.now() - startTime;

//       this.logger.error(
//         'BusinessDataExtractorJob: Error en el proceso de extracción:',
//         error,
//       );

//       this.customLogger.logJob({
//         jobName: 'BusinessDataExtractorJob',
//         operation: 'extract_data_error',
//         status: 'failed',
//         details: {
//           duration_ms: duration,
//           error: error?.message || error.toString(),
//         },
//       });

//       throw error;
//     }
//   }

//   /**
//    * Procesa los datos de una cuenta específica de forma thread-safe
//    */
//   private async processAccountDataThreadSafe(
//     login: string,
//     account: Account,
//   ): Promise<boolean> {
//     this.logger.debug(
//       `BusinessDataExtractorJob: Iniciando procesamiento de cuenta ${login}`,
//     );

//     try {
//       let brokeretData = null;

//       try {
//         // Extraer datos de Brokeret API para esta cuenta
//         brokeretData = await this.extractAccountDataFromBrokeret(login);
//         this.logger.debug(
//           `BusinessDataExtractorJob: Datos extraídos de Brokeret para cuenta ${login}: ${JSON.stringify(brokeretData)}`,
//         );
//       } catch (apiError) {
//         // REGLA 1: Si no hay respuesta de la API, continuar con data existente
//         this.logger.warn(
//           `BusinessDataExtractorJob: Error en API de Brokeret para cuenta ${login}, continuando con data existente:`,
//           apiError.message,
//         );
//         brokeretData = null; // Esto activará las operaciones de riesgo y guardado
//       }

//       // Mapear datos de Brokeret al formato del buffer (puede ser null)
//       const updatedAccount = await this.dataMapper.mapBrokeretDataToAccount(
//         account,
//         brokeretData,
//       );

//       // Actualizar la cuenta en el buffer de forma thread-safe
//       await this.buffer.upsertAccount(login, (prev) => {
//         // Usar la cuenta actual del buffer (prev) como base para evitar condiciones de carrera
//         return updatedAccount;
//       });

//       if (brokeretData === null) {
//         this.logger.debug(
//           `BusinessDataExtractorJob: Cuenta ${login} procesada con data existente debido a error de API`,
//         );
//       } else {
//         this.logger.debug(
//           `BusinessDataExtractorJob: Cuenta ${login} actualizada con nueva data de Brokeret`,
//         );
//       }

//       return true;
//     } catch (error) {
//       this.logger.error(
//         `BusinessDataExtractorJob: Error procesando datos de cuenta ${login}:`,
//         error,
//       );
//       throw error;
//     }
//   }

//   /**
//    * Extrae todos los datos necesarios de Brokeret API para una cuenta
//    */
//   private async extractAccountDataFromBrokeret(login: string): Promise<any> {
//     this.logger.debug(
//       `BusinessDataExtractorJob: Extrayendo datos de Brokeret para cuenta ${login}`,
//     );

//     try {
//       // Obtener fechas para el rango de consulta
//       const today = new Date();
//       const startDate = new Date(today.getTime() - 90 * 24 * 60 * 60 * 1000); // 90 days before today
//       const endDate = today;

//       // Ejecutar todas las consultas en paralelo para optimizar el rendimiento
//       const [
//         openPositions,
//         closedPositions,
//         userOrders,
//         userDetails,
//         profitabilityAnalytics,
//       ] = await Promise.all([
//         // Posiciones abiertas
//         this.fazoClient.getPosition(parseInt(login)),

//         // Posiciones cerradas
//         this.fazoClient.listClosedPositions({
//           login,
//           start_time: this.formatDate(startDate),
//           end_time: this.formatDate(endDate),
//         }),

//         // Órdenes del usuario
//         this.fazoClient.listUserOrders(login),

//         // Estadísticas del usuario

//         // Detalles del usuario (nueva estructura)
//         this.fazoClient.getUserDetails(login),

//         // Análisis de rentabilidad (últimos 30 días)
//         this.fazoClient.getProfitabilityAnalytics(login, 30),
//       ]);

//       return {
//         login,
//         openPositions,
//         closedPositions,
//         userOrders,
//         userDetails,
//         profitabilityAnalytics,
//         lastUpdate: new Date().toISOString(),
//       };
//     } catch (error) {
//       this.logger.error(
//         `BusinessDataExtractorJob: Error extrayendo datos de Brokeret para cuenta ${login}:`,
//         error,
//       );
//       throw error;
//     }
//   }

//   /**
//    * Formatea una fecha al formato requerido por Brokeret API (dd/MM/yyyy)
//    */
//   private formatDate(date: Date): string {
//     const day = date.getDate().toString().padStart(2, '0');
//     const month = (date.getMonth() + 1).toString().padStart(2, '0');
//     const year = date.getFullYear();
//     return `${year}-${month}-${day}`;
//   }
// }
