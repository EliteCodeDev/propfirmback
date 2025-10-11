import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { BrokeretApiClient } from 'src/modules/data/brokeret-api/client/brokeret-api.client';
import { CreationFazoClient } from 'src/modules/data/brokeret-api/client/creation-fazo.client';
import { BufferService } from 'src/lib/buffer/buffer.service';
import { Account } from 'src/common/utils/account';
import { BrokeretDataMapper } from './mappers/brokeret-data.mapper';
import { CustomLoggerService } from 'src/common/services/custom-logger.service';
import { OpenPositionsResponse } from 'src/modules/data/brokeret-api/types/response.type';

@Injectable()
export class BrokeretDataExtractorJob implements OnModuleInit {
  private readonly logger = new Logger(BrokeretDataExtractorJob.name);

  constructor(
    private readonly brokeretApiClient: BrokeretApiClient,
    private readonly fazoClient: CreationFazoClient,
    private readonly buffer: BufferService,
    private readonly dataMapper: BrokeretDataMapper,
    private readonly customLogger: CustomLoggerService,
  ) { }

  onModuleInit() {
    this.logger.log('BrokeretDataExtractorJob inicializado');
    // No ejecutar al inicio - solo cuando haya datos en el buffer
    this.logger.debug(
      'Job configurado para ejecutarse cada 3 minutos cuando haya cuentas en el buffer',
    );
  }

  // Método removido - ahora es llamado por BufferDataUpdaterJob
  // El decorador @Cron fue movido al BufferDataUpdaterJob centralizado

  /**
   * Proceso principal de extracción de datos (público para ser llamado por BufferDataUpdaterJob)
   */
  async extractBrokeretDataProcess() {
    const startTime = Date.now();

    this.customLogger.logJob({
      jobName: 'BrokeretDataExtractorJob',
      operation: 'extract_data_start',
      status: 'started',
      details: {},
    });

    try {
      // Obtener estadísticas del buffer para verificar si hay cuentas
      const stats = this.buffer.getStats();

      //si se llama a la función, naturalemte hay cuentas en el buffer
      // if (stats.bufferSize === 0) {
      //   this.logger.debug('No hay cuentas en el buffer para procesar');

      //   this.customLogger.logJob({
      //     jobName: 'BrokeretDataExtractorJob',
      //     operation: 'extract_data_empty',
      //     status: 'completed',
      //     details: {
      //       buffer_size: 0,
      //       duration_ms: Date.now() - startTime,
      //     },
      //   });
      //   return;
      // }

      this.logger.debug(
        `BrokeretDataExtractorJob: Procesando ${stats.bufferSize} cuentas del buffer`,
      );

      this.customLogger.logJob({
        jobName: 'BrokeretDataExtractorJob',
        operation: 'extract_data_processing',
        status: 'in_progress',
        details: { buffer_size: stats.bufferSize },
      });

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

      const duration = Date.now() - startTime;

      this.customLogger.logJob({
        jobName: 'BrokeretDataExtractorJob',
        operation: 'extract_data_success',
        status: 'completed',
        details: {
          duration_ms: duration,
          total_accounts: results.length,
          processed_count: processedCount,
          error_count: errorCount,
          buffer_size: stats.bufferSize,
        },
      });
    } catch (error) {
      const duration = Date.now() - startTime;

      this.logger.error(
        'BrokeretDataExtractorJob: Error en el proceso de extracción:',
        error,
      );

      this.customLogger.logJob({
        jobName: 'BrokeretDataExtractorJob',
        operation: 'extract_data_error',
        status: 'failed',
        details: {
          duration_ms: duration,
          error: error?.message || error.toString(),
        },
      });

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
      let brokeretData = null;

      try {
        // Extraer datos de Brokeret API para esta cuenta
        brokeretData = await this.extractAccountDataFromBrokeret(login);
        this.logger.debug(
          `BrokeretDataExtractorJob: Datos extraídos de Brokeret para cuenta ${login}: ${JSON.stringify(brokeretData)}`,
        );
      } catch (apiError) {
        // REGLA 1: Si no hay respuesta de la API, continuar con data existente
        this.logger.warn(
          `BrokeretDataExtractorJob: Error en API de Brokeret para cuenta ${login}, continuando con data existente:`,
          apiError.message,
        );
        brokeretData = null; // Esto activará las operaciones de riesgo y guardado
      }

      // Recrear instancia de Account desde snapshot para restaurar métodos de clase
      const accountInstance = this.recreateAccountInstance(account);

      // Mapear datos de Brokeret al formato del buffer (puede ser null)
      const updatedAccount = await this.dataMapper.mapBrokeretDataToAccount(
        accountInstance,
        brokeretData,
      );

      // Luego, actualizamos en el buffer de forma thread-safe
      await this.buffer.upsertAccount(login, (prev) => {
        // Usamos la cuenta actualizada (ya procesada con los nuevos datos)
        updatedAccount.markAsDirty();
        return updatedAccount;
      });


      if (brokeretData === null) {
        this.logger.debug(
          `BrokeretDataExtractorJob: Cuenta ${login} procesada con data existente debido a error de API`,
        );
      } else {
        this.logger.debug(
          `BrokeretDataExtractorJob: Cuenta ${login} actualizada con nueva data de Brokeret`,
        );
      }

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
   * Recrea una instancia de Account desde un objeto plano para restaurar métodos de clase
   */
  private recreateAccountInstance(accountData: any): Account {
    const instance = new Account(accountData.accountID, accountData.login);
    Object.assign(instance, accountData);
    if (accountData.createDateTime) {
      instance.createDateTime = new Date(accountData.createDateTime);
    }
    if (accountData.lastUpdate) {
      instance.lastUpdate = new Date(accountData.lastUpdate);
    }
    return instance;
  }

  /**
   * Extrae todos los datos necesarios de Brokeret API para una cuenta
   */
  private async extractAccountDataFromBrokeret(login: string): Promise<any> {
    this.logger.debug(
      `🔍 Extracting account data using FAZO API for login ${login}`,
    );

    try {
      const today = new Date();
      const startDate = new Date(today.getTime() - 90 * 24 * 60 * 60 * 1000);
      const endDate = today;

      // 🔹 Solo usamos FAZO como fuente principal
      const openPositions = await this.getFazoOpenPositionsAsBrokeretFormat(login);

      // 🔹 Las demás estructuras se inicializan vacías
      const closedPositions = {
        success: true,
        message: 'Closed positions not implemented for FAZO yet',
        data: { deals: [] },
        total_count: 0,
        timestamp: new Date().toISOString(),
      };

      const userOrders = {
        success: true,
        message: 'User orders not implemented for FAZO yet',
        data: { orders: [] },
        total_count: 0,
        timestamp: new Date().toISOString(),
      };

      // 🔹 Detalles básicos del usuario (puedes mejorar esto luego)
      const userDetails = {
        success: true,
        message: 'User details from FAZO placeholder',
        data: {
          balance: 10000, // o consulta real si FAZO lo tiene
          equity: 10000,
        },
        timestamp: new Date().toISOString(),
      };

      const profitabilityAnalytics = {
        success: true,
        message: 'Profitability analytics placeholder for FAZO',
        data: {},
        timestamp: new Date().toISOString(),
      };

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
        `❌ Error extrayendo datos de FAZO para cuenta ${login}:`,
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

  /**
   * Obtiene las posiciones abiertas usando FAZO y las adapta al formato OpenPositionsResponse
   */
  private async getFazoOpenPositionsAsBrokeretFormat(
  login: string,
): Promise<OpenPositionsResponse> {
  try {
    const raw = await this.fazoClient.getPosition(parseInt(login));

    // 🔹 Soportar ambas estructuras: con openPositions o array plano
    const positions =
      Array.isArray(raw)
        ? raw
        : raw?.openPositions
        ?? raw?.positions
        ?? raw?.data?.positions
        ?? raw?.data?.openPositions
        ?? [];

    if (!Array.isArray(positions)) {
      this.logger.error(`⚠️ Estructura inesperada en getPosition para ${login}:`, raw);
      return {
        success: false,
        message: 'Unexpected structure from FAZO',
        data: {
          login: Number(login),
          positions: [],
          summary: { total_positions: 0, total_profit: 0, total_volume: 0 },
        },
        total_count: 0,
        timestamp: new Date().toISOString(),
      };
    }

    // 🔹 Mapear posiciones FAZO → formato estándar
    const mappedPositions = positions.map((pos: any) => {
      const actionName = String(pos.type || '').toUpperCase();
      const action = actionName === 'SELL' ? 1 : 0;

      return {
        ticket: pos.positionid ?? pos.id ?? 0,
        login: pos.loginid ?? Number(login),
        symbol: pos.symbol ?? '',
        action,
        action_name: actionName,
        volume: Number(pos.lotsize ?? pos.volume ?? 0),
        price_open: Number(pos.price_open ?? pos.price ?? 0),
        price_current: Number(pos.price_current ?? pos.currentPrice ?? 0),
        price_sl: Number(pos.price_sl ?? pos.sl ?? 0),
        price_tp: Number(pos.price_tp ?? pos.tp ?? 0),
        profit: Number(pos.profit ?? 0),
        commission: Number(pos.commission ?? pos.commssion ?? 0),
        swap: Number(pos.swap ?? 0),
        time_create: typeof pos.opentime === 'number'
          ? new Date(pos.opentime * 1000).toISOString()
          : new Date().toISOString(),
        time_update: new Date().toISOString(),
        comment: pos.comment ?? '',
      };
    });

    const totalProfit = mappedPositions.reduce((a, p) => a + (p.profit || 0), 0);
    const totalVolume = mappedPositions.reduce((a, p) => a + (p.volume || 0), 0);

    this.logger.debug(
      `✅ ${mappedPositions.length} posiciones abiertas detectadas para ${login}`,
    );

    return {
      success: true,
      message: `Retrieved ${mappedPositions.length} positions for user ${login}`,
      data: {
        login: Number(login),
        positions: mappedPositions,
        summary: {
          total_positions: mappedPositions.length,
          total_profit: totalProfit,
          total_volume: totalVolume,
        },
      },
      total_count: mappedPositions.length,
      timestamp: new Date().toISOString(),
    };
  } catch (error: any) {
    this.logger.error(
      `❌ Error obteniendo posiciones abiertas desde FAZO para login=${login}:`,
      error?.response?.data || error.message,
    );
    return {
      success: false,
      message: 'Error retrieving open positions',
      data: {
        login: Number(login),
        positions: [],
        summary: { total_positions: 0, total_profit: 0, total_volume: 0 },
      },
      total_count: 0,
      timestamp: new Date().toISOString(),
    };
  }
}


}
