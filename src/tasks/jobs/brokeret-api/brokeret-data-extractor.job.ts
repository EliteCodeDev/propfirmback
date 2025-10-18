import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { BrokeretApiClient } from 'src/modules/data/brokeret-api/client/brokeret-api.client';
import { CreationFazoClient } from 'src/modules/data/brokeret-api/client/creation-fazo.client';
import { BufferService } from 'src/lib/buffer/buffer.service';
import { Account } from 'src/common/utils/account';
import { BrokeretDataMapper } from './mappers/brokeret-data.mapper';
import { CustomLoggerService } from 'src/common/services/custom-logger.service';
import { OpenPositionsResponse, ClosedPositionsResponse } from 'src/modules/data/brokeret-api/types/response.type';

@Injectable()
export class BrokeretDataExtractorJob implements OnModuleInit {
  private readonly logger = new Logger(BrokeretDataExtractorJob.name);
  // Cache para la ejecución actual: se llena una vez y se reutiliza por login
  private allInfosCache: any | null = null;
  // Helper: extrae el login numérico desde cadenas tipo "MT5_123" o similares
  private extractNumericLogin(login: string): number | null {
    if (!login) return null;
    const match = String(login).match(/\d{3,}/g);
    if (!match || match.length === 0) return null;
    const digits = match.sort((a, b) => b.length - a.length)[0];
    const n = Number(digits);
    return Number.isFinite(n) ? n : null;
  }

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

      // Cachear FAZO getAllAccountInfos una sola vez por ejecución
      try {
        this.logger.debug('🔁 Reforzando conexión al Manager antes de obtener balances...');
        await this.fazoClient.connectToManager();

        this.allInfosCache = await this.fazoClient.getAllAccountInfos();
        if (!Array.isArray(this.allInfosCache)) {
          this.logger.warn('⚠️ Estructura inesperada en getAllAccountInfos, normalizando...');
          this.allInfosCache =
            (this.allInfosCache?.data as any[]) ??
            (this.allInfosCache?.result as any[]) ??
            [];
        }

        this.logger.debug(
          `✅ getAllAccountInfos cacheado (${this.allInfosCache.length} cuentas FAZO)`,
        );
      } catch (err: any) {
        this.logger.warn(
          `⚠️ Fallo cacheando getAllAccountInfos, usando fallback. Error: ${err?.message ?? err}`,
        );
        this.allInfosCache = [];
      }

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
        brokeretData = await this.extractAccountDataFromBrokeret(login, account);
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
  private async extractAccountDataFromBrokeret(login: string, account: Account): Promise<any> {
    this.logger.debug(
      `🔍 Extracting account data for login ${login} (FAZO positions + Brokeret details)`,
    );

    try {
      // Inicio = fecha de creación del login; Fin = fecha actual + 1 día
      const now = new Date();
      const endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      endDate.setDate(endDate.getDate() + 2);

      // Rango de consulta para cerradas:
      // - Inicio: fecha de creación del challenge menos 1 día (normalizado al inicio del día)
      // - Fin: día actual + 1 día (ya definido en endDate)
      let startDate: Date;
      if (account?.createDateTime) {
        const challengeStart = account.createDateTime instanceof Date
          ? account.createDateTime
          : new Date(account.createDateTime);
        const startOfChallengeDay = new Date(
          challengeStart.getFullYear(),
          challengeStart.getMonth(),
          challengeStart.getDate(),
        );
        // Cambiar a 3 meses antes
        startOfChallengeDay.setMonth(startOfChallengeDay.getMonth() - 3);
        startDate = startOfChallengeDay;
        this.logger.debug(`📅 Ventana FAZO para ${login}: start=${this.formatDate(startDate)} (desde createDateTime=${challengeStart.toISOString()} -3m), end=${this.formatDate(endDate)}`);
      } else {
        // Fallback de seguridad: 3 meses hacia atrás desde hoy (inicio del día)
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        startOfToday.setMonth(startOfToday.getMonth() - 3);
        startDate = startOfToday;
        this.logger.debug(`📅 Ventana FAZO para ${login}: start=${this.formatDate(startDate)} (fallback -3m), end=${this.formatDate(endDate)}`);
      }

      // Clamp: si por alguna razón start > end, retroceder 1 día
      if (startDate > endDate) {
        const oldStart = new Date(startDate.getTime());
        startDate = new Date(endDate.getTime() - 24 * 60 * 60 * 1000);
        this.logger.warn(`🧲 Clamp aplicado para ${login}: start=${this.formatDate(oldStart)} > end=${this.formatDate(endDate)} ⇒ nuevo start=${this.formatDate(startDate)}`);
      }

      // 🔹 Solo usamos FAZO como fuente principal
      const openPositions = await this.getFazoOpenPositionsAsBrokeretFormat(login);

      // 🔹 Posiciones cerradas desde FAZO tradehistory
      const closedPositions = await this.getFazoClosedPositionsAsBrokeretFormat(
        login,
        startDate,
        endDate,
      );

      this.logger.debug(
        `📈 Resumen FAZO ${login}: abiertas=${openPositions?.total_count ?? openPositions?.data?.summary?.total_positions ?? 0}, cerradas=${closedPositions?.total_count ?? closedPositions?.data?.summary?.total_deals ?? 0} en ventana ${this.formatDate(startDate)}→${this.formatDate(endDate)}`,
      );

      const userOrders = {
        success: true,
        message: 'User orders not implemented for FAZO yet',
        data: { orders: [] },
        total_count: 0,
        timestamp: new Date().toISOString(),
      };

      // 🔹 Obtener equity/balance desde FAZO getAllAccountInfos (cacheado); fallback a Brokeret si no aparece
      let userDetails: any;
      let profitabilityAnalytics: any;
      try {
        const allInfos = this.allInfosCache;
        const profitability = await this.brokeretApiClient.getProfitabilityAnalytics(login, 30);

        // 🔍 Normalizar estructura de getAllAccountInfos y buscar la cuenta (primero numérico, luego string)
        const infosArray = Array.isArray(this.allInfosCache)
          ? (this.allInfosCache as any[])
          : (
            (this.allInfosCache?.data?.accounts as any[]) ??
            (this.allInfosCache?.data as any[]) ??
            (this.allInfosCache?.users as any[]) ??
            (this.allInfosCache?.accounts as any[]) ??
            []
          );

        const info = Array.isArray(infosArray)
          ? infosArray.find((i: any) => {
            const targetNum = this.extractNumericLogin(login);
            const candidates = [i.loginid, i.loginId, i.accountId, i.login];
            const candidateNum = candidates
              .map((v) => {
                const m = String(v ?? '').match(/\d{3,}/);
                return m ? Number(m[0]) : Number(v);
              })
              .find((n) => Number.isFinite(n));

            if (targetNum != null && candidateNum != null) {
              return targetNum === candidateNum;
            }

            const normalize = (val: any) =>
              String(val ?? '')
                .replace(/^L#|^D#/, '')
                .trim();
            return normalize(login) === normalize(i.accountId ?? i.loginid ?? i.loginId ?? i.login ?? '');
          })
          : null;


        // 🧩 Log de verificación
        if (!info) {
          this.logger.warn(`⚠️ Cuenta ${login} no encontrada en getAllAccountInfos`);
        } else {
          this.logger.debug(
            `✅ Cuenta ${login} encontrada en getAllAccountInfos con balance=${info.balance} y equity=${info.equity}`,
          );
        }

        // Valores previos y bases para fallback
        const initialBalance = Number(
          account?.balance?.initialBalance ?? account?.balance?.currentBalance ?? 0,
        );
        const prevBalanceForFallback = Number(
          account?.balance?.currentBalance ?? initialBalance,
        );
        const prevEquityForFallback = Number(
          typeof account?.equity === 'number' ? account.equity : prevBalanceForFallback,
        );

        // Resumen de actividad desde FAZO (closed/open summaries)
        const closedNet = Number(
          (typeof closedPositions === 'object'
            ? (closedPositions as any)?.data?.summary?.net_profit
            : 0) ?? 0,
        );
        const openProfit = Number(
          (typeof openPositions === 'object'
            ? (openPositions as any)?.data?.summary?.total_profit
            : 0) ?? 0,
        );
        const computedCurrentBalance = Number(initialBalance) + Number(closedNet || 0);
        const computedEquity = computedCurrentBalance + Number(openProfit || 0);
        const hasActivity = Math.abs(closedNet) > 0.0001 || Math.abs(openProfit) > 0.0001;

        // 1) Intentar usar datos de FAZO (getAllAccountInfos) si existen y no son sospechosos
        if (info) {
          const fetchedBalance = Number(info.balance ?? 0);
          const fetchedEquity = Number(info.equity ?? 0);
          const prevBalance = Number(account?.balance?.currentBalance ?? 0);

          userDetails = {
            success: true,
            message: 'User details from FAZO getAllAccountInfos',
            data: {
              balance: fetchedBalance,
              equity: fetchedEquity,
            },
            timestamp: new Date().toISOString(),
          };

          if (Math.abs(fetchedBalance - prevBalance) > 0.0001) {
            (userDetails as any)._forceSync = true;
            this.logger.debug(
              `🔄 Balance actualizado desde FAZO para ${login}: ${prevBalance} → ${fetchedBalance}`,
            );
          } else {
            this.logger.debug(
              `⚙️ Balance FAZO igual al actual (${fetchedBalance}) para ${login}, no se forzará sync`,
            );
          }
        }

        // 2) Aplicar fallback SOLO si falta info o si hay actividad y los valores remotos parecen iniciales/0
        const infoMissing = !info;
        const infoSuspicious = !!info && (
          hasActivity && (
            Math.abs(Number(info?.equity ?? 0)) < 0.0001 ||
            Math.abs(Number(info?.balance ?? 0) - initialBalance) < 0.0001
          )
        );

        if (infoMissing || infoSuspicious || !userDetails) {
          if (hasActivity) {
            userDetails = {
              success: true,
              message: 'User details computed from FAZO summaries (fallback, activity detected)',
              data: {
                balance: computedCurrentBalance,
                equity: computedEquity,
              },
              timestamp: new Date().toISOString(),
            };
            this.logger.debug(
              `🔄 Fallback con actividad para ${login}: balance=${computedCurrentBalance}, equity=${computedEquity} (initial=${initialBalance}, closedNet=${closedNet}, openProfit=${openProfit})`,
            );
          } else {
            // Sin actividad: preservar valores previos para evitar reset al initialBalance
            userDetails = {
              success: true,
              message: 'User details preserved from previous account state (fallback without activity)',
              data: {
                balance: prevBalanceForFallback,
                equity: prevEquityForFallback,
              },
              timestamp: new Date().toISOString(),
            };
            this.logger.warn(
              `🛡️ Preservado fallback para ${login}: prevBalance=${prevBalanceForFallback}, prevEquity=${prevEquityForFallback}`,
            );
          }
        }

        // Usar profitability del API si fue correcto
        profitabilityAnalytics = profitability;
      } catch (err) {
        this.logger.warn(
          `⚠️ No se pudo obtener userDetails/profitability para ${login}. Usando fallback. Error: ${err?.message || err}`,
        );
        // Fallback mínimo para no romper el mapeo, pero intentar computar con summaries si existen
        const closedNet = Number(
          (typeof closedPositions === 'object'
            ? (closedPositions as any)?.data?.summary?.net_profit
            : 0) ?? 0,
        );
        const openProfit = Number(
          (typeof openPositions === 'object'
            ? (openPositions as any)?.data?.summary?.total_profit
            : 0) ?? 0,
        );
        const initialBalance = Number(
          account?.balance?.initialBalance ?? account?.balance?.currentBalance ?? 0,
        );
        const prevBalanceForFallback = Number(
          account?.balance?.currentBalance ?? initialBalance,
        );
        const prevEquityForFallback = Number(
          typeof account?.equity === 'number' ? account.equity : prevBalanceForFallback,
        );
        const computedCurrentBalance = Number(initialBalance) + Number(closedNet || 0);
        const computedEquity = computedCurrentBalance + Number(openProfit || 0);

        const hasActivity = Math.abs(closedNet) > 0.0001 || Math.abs(openProfit) > 0.0001;

        if (hasActivity) {
          userDetails = {
            success: true,
            message: 'User details fallback (computed from FAZO summaries when possible)',
            data: {
              balance: computedCurrentBalance,
              equity: computedEquity,
            },
            timestamp: new Date().toISOString(),
          };
        } else {
          userDetails = {
            success: true,
            message: 'User details preserved from previous account state (catch fallback without activity)',
            data: {
              balance: prevBalanceForFallback,
              equity: prevEquityForFallback,
            },
            timestamp: new Date().toISOString(),
          };
          this.logger.warn(
            `🛡️ Preservado en catch fallback para ${login}: prevBalance=${prevBalanceForFallback}, prevEquity=${prevEquityForFallback}`,
          );
        }

        profitabilityAnalytics = {
          success: true,
          message: 'Profitability analytics fallback',
          data: {},
          timestamp: new Date().toISOString(),
        };
      }

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
    return `${month}/${day}/${year}`;
  }

  /**
   * Obtiene las posiciones abiertas usando FAZO y las adapta al formato OpenPositionsResponse
   */
  private async getFazoOpenPositionsAsBrokeretFormat(
    login: string,
  ): Promise<OpenPositionsResponse> {
    try {
      const loginId = this.extractNumericLogin(login);
      const raw = await this.fazoClient.getPosition(loginId ?? Number(login));

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
            login: loginId ?? Number(login),
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
          login: this.extractNumericLogin(login) ?? Number(login),
          positions: [],
          summary: { total_positions: 0, total_profit: 0, total_volume: 0 },
        },
        total_count: 0,
        timestamp: new Date().toISOString(),
      };
    }

  }

  /**
   * Obtiene las operaciones cerradas usando FAZO (Home/tradehistory) y las adapta al formato ClosedPositionsResponse
   */
  private async getFazoClosedPositionsAsBrokeretFormat(
    login: string,
    startDate: Date,
    endDate: Date,
  ): Promise<ClosedPositionsResponse> {
    try {
      const loginId = this.extractNumericLogin(login) ?? Number(login);
      this.logger.debug(`📡 Consultando tradehistory FAZO login=${loginId} start=${this.formatDate(startDate)} end=${this.formatDate(endDate)}`);
      const raw = await this.fazoClient.getTradeHistory({
        loginId: loginId,
        startDate: this.formatDate(startDate),
        endDate: this.formatDate(endDate),
      });

      const deals = (
        raw?.deals ?? raw?.data?.deals ?? []
      ) as any[];

      if (!Array.isArray(deals)) {
        this.logger.error(`⚠️ Estructura inesperada en tradehistory para ${login}:`, raw);
        return {
          success: false,
          message: 'Unexpected structure from FAZO tradehistory',
          data: {
            login: loginId,
            deals: [],
            summary: {
              total_deals: 0,
              total_profit: 0,
              total_volume: 0,
              total_commission: 0,
              total_swap: 0,
              net_profit: 0,
              date_from: this.formatDate(startDate),
              date_to: this.formatDate(endDate),
            },
          },
          total_count: 0,
          timestamp: new Date().toISOString(),
        };
      }

      const rawDealsCount = deals.length;
      const balanceDealsCount = deals.filter((d: any) => String(d.type || '').toUpperCase() === 'DEAL_BALANCE').length;

      // Filtrar balances (no son operaciones de mercado) y agrupar por positionid/orderId
      const validDeals = deals.filter((d: any) => String(d.type || '').toUpperCase() !== 'DEAL_BALANCE');
      const grouped: Record<string, any[]> = {};
      for (const d of validDeals) {
        const key = String(d.positionid ?? d.orderId ?? d.dealId ?? 'unknown');
        if (!grouped[key]) grouped[key] = [];
        grouped[key].push(d);
      }

      const processed = Object.values(grouped)
        .map((group) => {
          // Determinar entrada/salida incluso si no hay flags ENTRY_IN/ENTRY_OUT
          const sortByTime = (a: any, b: any) => {
            const ta = typeof a?.opentime === 'number' ? a.opentime : Date.parse(a?.time || a?.time_open || 0) / 1000;
            const tb = typeof b?.opentime === 'number' ? b.opentime : Date.parse(b?.time || b?.time_open || 0) / 1000;
            return (ta || 0) - (tb || 0);
          };
          const sorted = [...group].sort(sortByTime);
          const entry = sorted[0];
          const exit = sorted[sorted.length - 1];

          const actionNameRaw = String(entry?.type || '').toUpperCase();
          const actionName = actionNameRaw.replace('DEAL_', ''); // DEAL_BUY -> BUY

          const priceOpen = Number(entry?.price ?? entry?.price_open ?? 0);
          const priceClose = Number(exit?.price ?? exit?.price_close ?? exit?.currentPrice ?? entry?.price ?? 0);

          const timeOpen = typeof entry?.opentime === 'number'
            ? new Date(entry.opentime * 1000).toISOString()
            : (entry?.time || entry?.time_open || new Date().toISOString());
          const timeClose = typeof exit?.opentime === 'number'
            ? new Date(exit.opentime * 1000).toISOString()
            : (exit?.time || exit?.time_close || timeOpen);

          const commission = Number(entry?.commssion ?? entry?.commission ?? 0) + Number(exit?.commssion ?? exit?.commission ?? 0);
          const swap = Number(entry?.swap ?? 0) + Number(exit?.swap ?? 0);
          const profit = Number(exit?.profit ?? 0) + Number(entry?.profit ?? 0);
          const netProfit = profit - commission - swap;

          // Si solo hay un registro, aún lo consideramos operación cerrada con tiempos iguales
          const durationSeconds = Math.max(0, Math.floor((new Date(timeClose).getTime() - new Date(timeOpen).getTime()) / 1000));

          return {
            ticket: Number(exit?.dealId ?? entry?.dealId ?? entry?.ticket ?? 0),
            order: Number(entry?.orderId ?? entry?.positionid ?? entry?.order ?? 0),
            position_id: Number(entry?.positionid ?? entry?.orderId ?? entry?.position_id ?? 0),
            login: Number(entry?.loginid ?? entry?.login ?? login),
            symbol: String(entry?.symbol ?? ''),
            action: actionName,
            action_name: actionName,
            volume: Number(entry?.lotsize ?? entry?.volume ?? 0),
            price_open: priceOpen,
            price_close: priceClose,
            time_open: timeOpen,
            time_close: timeClose,
            duration_seconds: durationSeconds,
            profit,
            commission,
            swap,
            net_profit: netProfit,
            comment: String(exit?.comment ?? entry?.comment ?? ''),
            group: String(exit?.groupname ?? entry?.group ?? ''),
            email: String(exit?.email ?? entry?.email ?? ''),
          };
        })
        .filter((p) => !!p);

      if (validDeals.length === 0) {
        this.logger.warn(`ℹ️ Sin operaciones cerradas en rango para ${login} en ventana ${this.formatDate(startDate)}→${this.formatDate(endDate)} (raw=${rawDealsCount}, balance=${balanceDealsCount}, procesadas=${processed.length})`);
      }

      const totalProfit = processed.reduce((a: number, d: any) => a + Number(d.profit || 0), 0);
      const totalVolume = processed.reduce((a: number, d: any) => a + Number(d.volume || 0), 0);
      const totalCommission = processed.reduce((a: number, d: any) => a + Number(d.commission || 0), 0);
      const totalSwap = processed.reduce((a: number, d: any) => a + Number(d.swap || 0), 0);
      const netProfit = totalProfit - totalCommission - totalSwap;

      this.logger.debug(`✅ ${processed.length} operaciones cerradas detectadas para ${login}`);

      return {
        success: true,
        message: `Retrieved ${processed.length} deals for user ${login}`,
        data: {
          login: loginId,
          deals: processed as any,
          summary: {
            total_deals: processed.length,
            total_profit: totalProfit,
            total_volume: totalVolume,
            total_commission: totalCommission,
            total_swap: totalSwap,
            net_profit: netProfit,
            date_from: this.formatDate(startDate),
            date_to: this.formatDate(endDate),
          },
        },
        total_count: processed.length,
        timestamp: new Date().toISOString(),
      };
    } catch (error: any) {
      this.logger.error(
        `❌ Error obteniendo tradehistory desde FAZO para login=${login}:`,
        error?.response?.data || error.message,
      );
      return {
        success: false,
        message: 'Error retrieving closed positions',
        data: {
          login: this.extractNumericLogin(login) ?? Number(login),
          deals: [],
          summary: {
            total_deals: 0,
            total_profit: 0,
            total_volume: 0,
            total_commission: 0,
            total_swap: 0,
            net_profit: 0,
            date_from: this.formatDate(startDate),
            date_to: this.formatDate(endDate),
          },
        },
        total_count: 0,
        timestamp: new Date().toISOString(),
      };
    }
  }
}
