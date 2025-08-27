import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { BrokeretApiClient } from 'src/modules/data/brokeret-api/client/brokeret-api.client';
import { BufferService } from 'src/lib/buffer/buffer.service';
import { Account } from 'src/common/utils/account';
import { BrokeretDataMapper } from './mappers/brokeret-data.mapper';

@Injectable()
export class BrokeretDataExtractorJob implements OnModuleInit {
  private readonly logger = new Logger(BrokeretDataExtractorJob.name);

  constructor(
    private readonly brokeretApiClient: BrokeretApiClient,
    private readonly buffer: BufferService,
    private readonly dataMapper: BrokeretDataMapper,
  ) {}

  onModuleInit() {
    this.logger.log('BrokeretDataExtractorJob inicializado');
    // No ejecutar al inicio - solo cuando haya datos en el buffer
    this.logger.debug(
      'Job configurado para ejecutarse cada 5 minutos cuando haya cuentas en el buffer',
    );
  }

  /**
   * Job programado para extraer datos de Brokeret API cada 5 minutos
   * Cron: cada 5 minutos
   */
  @Cron('0 */1 * * * *', { timeZone: 'America/Lima' })
  async extractBrokeretData() {
    this.logger.log('Iniciando extracción de datos de Brokeret API');

    try {
      await this.extractBrokeretDataProcess();
      this.logger.log(
        'Extracción de datos de Brokeret API completada exitosamente',
      );
    } catch (error) {
      this.logger.error(
        'Error en el proceso de extracción de datos de Brokeret API:',
        error,
      );
    }
  }

  /**
   * Proceso principal de extracción de datos
   */
  async extractBrokeretDataProcess() {
    try {
      // Obtener estadísticas del buffer para verificar si hay cuentas
      const stats = this.buffer.getStats();

      if (stats.bufferSize === 0) {
        this.logger.debug('No hay cuentas en el buffer para procesar');
        return;
      }

      this.logger.debug(
        `BrokeretDataExtractorJob: Procesando ${stats.bufferSize} cuentas del buffer`,
      );

      // Usar processAllParallel para procesamiento thread-safe y paralelo
      const results = await this.buffer.processAllParallel(
        async (login: string, account: Account) => {
          return await this.processAccountDataThreadSafe(login, account);
        },
        {
          skipEmpty: true,
          logErrors: true,
          maxConcurrency: 5, // Limitar concurrencia para evitar sobrecarga de la API
        },
      );

      // Contar resultados
      const processedCount = results.filter(
        (r) => r.result !== null && !r.error,
      ).length;
      const errorCount = results.filter((r) => r.error).length;

      this.logger.debug(
        `BrokeretDataExtractorJob: ${processedCount}/${results.length} cuentas procesadas exitosamente, ${errorCount} errores`,
      );

      // Log del estado actual del buffer
      this.logger.debug(
        `BrokeretDataExtractorJob: Estado del buffer: ${JSON.stringify(
          this.buffer.getStats(),
        )}`,
      );
    } catch (error) {
      this.logger.error(
        'BrokeretDataExtractorJob: Error en el proceso de extracción:',
        error,
      );
      throw error;
    }
  }

  /**
   * Procesa los datos de una cuenta específica de forma thread-safe
   */
  private async processAccountDataThreadSafe(
    login: string,
    account: Account,
  ): Promise<boolean> {
    this.logger.debug(
      `BrokeretDataExtractorJob: Iniciando procesamiento de cuenta ${login}`,
    );

    try {
      // Extraer datos de Brokeret API para esta cuenta
      const brokeretData = await this.extractAccountDataFromBrokeret(login);
      this.logger.debug(
        `BrokeretDataExtractorJob: Datos extraídos de Brokeret para cuenta ${login}: ${JSON.stringify(brokeretData)}`,
      );
      this.logger.debug(
        `BrokeretDataExtractorJob: Datos mapeados para cuenta ${account}}`,
      );
      // Mapear datos de Brokeret al formato del buffer
      const updatedAccount = await this.dataMapper.mapBrokeretDataToAccount(
        account,
        brokeretData,
      );

      // Actualizar la cuenta en el buffer de forma thread-safe
      await this.buffer.upsertAccount(login, (prev) => {
        // Usar la cuenta actual del buffer (prev) como base para evitar condiciones de carrera
        return updatedAccount;
      });

      this.logger.debug(
        `BrokeretDataExtractorJob: Cuenta ${login} actualizada en el buffer`,
      );

      return true;
    } catch (error) {
      this.logger.error(
        `BrokeretDataExtractorJob: Error procesando datos de cuenta ${login}:`,
        error,
      );
      throw error;
    }
  }

  /**
   * Extrae todos los datos necesarios de Brokeret API para una cuenta
   */
  private async extractAccountDataFromBrokeret(login: string): Promise<any> {
    this.logger.debug(
      `BrokeretDataExtractorJob: Extrayendo datos de Brokeret para cuenta ${login}`,
    );

    try {
      // Obtener fechas para el rango de consulta
      const today = new Date();
      const startDate = new Date(today.getFullYear(), today.getMonth(), 1); // Primer día del mes
      const endDate = today;

      // Ejecutar todas las consultas en paralelo para optimizar el rendimiento
      const [
        openPositions,
        closedPositions,
        userOrders,
        userDetails,
        profitabilityAnalytics,
      ] = await Promise.all([
        // Posiciones abiertas
        this.brokeretApiClient.listOpenPositions(login),

        // Posiciones cerradas
        this.brokeretApiClient.listClosedPositions({
          login,
          start_time: this.formatDate(startDate),
          end_time: this.formatDate(endDate),
        }),

        // Órdenes del usuario
        this.brokeretApiClient.listUserOrders(login),

        // Estadísticas del usuario

        // Detalles del usuario (nueva estructura)
        this.brokeretApiClient.getUserDetails(login),

        // Análisis de rentabilidad (últimos 30 días)
        this.brokeretApiClient.getProfitabilityAnalytics(login, 30),
      ]);

      return {
        login,
        openPositions,
        closedPositions,
        userOrders,
        userDetails,
        profitabilityAnalytics,
        lastUpdate: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error(
        `BrokeretDataExtractorJob: Error extrayendo datos de Brokeret para cuenta ${login}:`,
        error,
      );
      throw error;
    }
  }

  /**
   * Formatea una fecha al formato requerido por Brokeret API (dd/MM/yyyy)
   */
  private formatDate(date: Date): string {
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${year}-${month}-${day}`;
  }
}
