import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { BrokeretApiClient } from 'src/modules/data/brokeret-api/client/brokeret-api.client';
import { CreationFazoClient } from 'src/modules/data/brokeret-api/client/creation-fazo.client';
import { BufferService } from 'src/lib/buffer/buffer.service';
import { Account } from 'src/common/utils/account';
import { BrokeretDataMapper } from './mappers/brokeret-data.mapper';
import { CustomLoggerService } from 'src/common/services/custom-logger.service';
import { OpenPositionsResponse, ClosedPositionsResponse } from 'src/modules/data/brokeret-api/types/response.type';
import { de } from '@faker-js/faker/.';

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

  // ────────────────────────────────────────────────
  // 🔹 Helpers y utilidades
  // ────────────────────────────────────────────────

  private extractNumericLogin(login: string): number | null {
    if (!login) return null;
    const match = String(login).match(/\d{3,}/g);
    if (!match || match.length === 0) return null;
    const digits = match.sort((a, b) => b.length - a.length)[0];
    const n = Number(digits);
    return Number.isFinite(n) ? n : null;
  }

  /** Formatea fecha a mm/dd/yyyy */
  private formatDate(date: Date): string {
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${month}/${day}/${year}`;
  }

  /** 🔹 Obtiene las posiciones abiertas desde FAZO y las adapta */
  private async getFazoOpenPositionsAsBrokeretFormat(
    login: string,
  ): Promise<OpenPositionsResponse> {
    try {
      const loginId = this.extractNumericLogin(login);
      const raw = await this.fazoClient.getPosition(loginId ?? Number(login));

      // Soportar múltiples estructuras
      const positions =
        Array.isArray(raw)
          ? raw
          : raw?.openPositions ??
          raw?.positions ??
          raw?.data?.positions ??
          raw?.data?.openPositions ??
          [];

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

      // Mapear formato estándar
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
          time_create:
            typeof pos.opentime === 'number'
              ? new Date(pos.opentime * 1000).toISOString()
              : new Date().toISOString(),
          time_update: new Date().toISOString(),
          comment: pos.comment ?? '',
        };
      });

      const totalProfit = mappedPositions.reduce((a, p) => a + (p.profit || 0), 0);
      const totalVolume = mappedPositions.reduce((a, p) => a + (p.volume || 0), 0);

      this.logger.debug(`✅ ${mappedPositions.length} posiciones abiertas para ${login}`);

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
      this.logger.error(`❌ Error en getFazoOpenPositionsAsBrokeretFormat(${login})`, error);
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

  /** 🔹 Obtiene operaciones cerradas FAZO (tradehistory) */
  private async getFazoClosedPositionsAsBrokeretFormat(
    login: string,
    startDate: Date,
    endDate: Date,
  ): Promise<ClosedPositionsResponse> {
    try {
      const loginId = this.extractNumericLogin(login) ?? Number(login);
      this.logger.debug(
        `📡 tradehistory login=${loginId} start=${this.formatDate(startDate)} end=${this.formatDate(endDate)}`,
      );

      const raw = await this.fazoClient.getTradeHistory({
        loginId,
        startDate: this.formatDate(startDate),
        endDate: this.formatDate(endDate),
      });

      const deals = raw?.deals ?? raw?.data?.deals ?? [];

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

      const validDeals = deals.filter(
        (d: any) => String(d.type || '').toUpperCase() !== 'DEAL_BALANCE',
      );
      const grouped: Record<string, any[]> = {};
      for (const d of validDeals) {
        const key = String(d.positionid ?? d.orderId ?? d.dealId ?? 'unknown');
        if (!grouped[key]) grouped[key] = [];
        grouped[key].push(d);
      }

      // Solo considerar como "cerrada" si existe evento de salida/cierre
      const ENTRY_TYPES = ['DEAL_BUY', 'DEAL_SELL', 'DEAL_ENTRY', 'BUY', 'SELL'];
      const EXIT_TYPES = ['DEAL_CLOSE', 'DEAL_OUT', 'CLOSE', 'DEAL_EXIT'];
      const processed = Object.values(grouped)
        .map((group) => {
          const sorted = [...group].sort(
            (a: any, b: any) =>
              new Date(a.time || a.time_open || 0).getTime() -
              new Date(b.time || b.time_open || 0).getTime(),
          );

          const typeOf = (x: any) => String(x?.type || '').toUpperCase();
          const entry = sorted.find((d: any) => ENTRY_TYPES.includes(typeOf(d))) ?? sorted[0];
          const exit = [...sorted].reverse().find((d: any) => EXIT_TYPES.includes(typeOf(d)));

          // Si no hay evento de cierre, esta posición sigue abierta → no la incluimos en cerradas
          if (!exit) {
            return null;
          }

          const entryType = typeOf(entry);
          const actionName = entryType.includes('SELL') ? 'SELL' : 'BUY';
          const priceOpen = Number(entry?.price_open ?? entry?.price ?? 0);
          const priceClose = Number(exit?.price_close ?? exit?.price ?? 0);
          const commission = Number(entry?.commission ?? 0) + Number(exit?.commission ?? 0);
          const swap = Number(entry?.swap ?? 0) + Number(exit?.swap ?? 0);
          const profit = Number(exit?.profit ?? 0) + Number(entry?.profit ?? 0);
          const netProfit = profit - commission - swap;

          return {
            ticket: Number(entry?.positionid ?? exit?.dealId ?? entry?.dealId ?? entry?.id ?? 0),
            login: Number(entry?.loginid ?? login),
            symbol: entry?.symbol ?? '',
            action: actionName,
            volume: Number(entry?.lotsize ?? entry?.volume ?? 0),
            price_open: priceOpen,
            price_close: priceClose,
            time_open: entry?.time_open ?? new Date().toISOString(),
            time_close: exit?.time_close ?? new Date().toISOString(),
            profit,
            commission,
            swap,
            net_profit: netProfit,
          };
        })
        .filter(Boolean);

      const totalProfit = processed.reduce((a, d) => a + (d.profit || 0), 0);
      const totalVolume = processed.reduce((a, d) => a + (d.volume || 0), 0);
      const totalCommission = processed.reduce((a, d) => a + (d.commission || 0), 0);
      const totalSwap = processed.reduce((a, d) => a + (d.swap || 0), 0);
      const netProfit = totalProfit - totalCommission - totalSwap;

      return {
        success: true,
        message: `Retrieved ${processed.length} deals for ${login}`,
        data: {
          login: loginId,
          deals: processed as ClosedPositionsResponse['data']['deals'],
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
      this.logger.error(`❌ Error en tradehistory(${login})`, error?.message);
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

  // ────────────────────────────────────────────────
  // 🔹 Inicialización y ciclo principal
  // ────────────────────────────────────────────────

  onModuleInit() {
    this.logger.log('BrokeretDataExtractorJob inicializado');
    this.logger.debug(
      'Job configurado para ejecutarse cada 3 minutos cuando haya cuentas en el buffer',
    );
  }

  async extractBrokeretDataProcess() {
    const startTime = Date.now();
    this.customLogger.logJob({
      jobName: 'BrokeretDataExtractorJob',
      operation: 'extract_data_start',
      status: 'started',
      details: {},
    });

    try {
      const stats = this.buffer.getStats();

      this.logger.debug(
        `Procesando ${stats.bufferSize} cuentas del buffer`,
      );

      const results = await this.buffer.processAllParallel(
        async (login: string, account: Account) => {
          return await this.processAccountDataThreadSafe(login, account);
        },
        { skipEmpty: true, logErrors: true, maxConcurrency: 5 },
      );

      const processedCount = results.filter((r) => r.result && !r.error).length;
      const errorCount = results.filter((r) => r.error).length;
      const duration = Date.now() - startTime;

      this.logger.debug(
        `Completado: ${processedCount}/${results.length} ok, ${errorCount} errores`,
      );

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
      this.logger.error(`Error general en extracción`, error);
      throw error;
    }
  }

  private async processAccountDataThreadSafe(login: string, account: Account): Promise<boolean> {
    this.logger.debug(`Procesando cuenta ${login}`);

    try {
      let brokeretData = await this.extractAccountDataFromBrokeret(login, account);
      const accountInstance = this.recreateAccountInstance(account);
      const updatedAccount = await this.dataMapper.mapBrokeretDataToAccount(
        accountInstance,
        brokeretData,
      );

      await this.buffer.upsertAccount(login, () => {
        updatedAccount.markAsDirty();
        return updatedAccount;
      });

      return true;
    } catch (error) {
      this.logger.error(`Error procesando cuenta ${login}`, error);
      throw error;
    }
  }

  private recreateAccountInstance(accountData: any): Account {
    const instance = new Account(accountData.accountID, accountData.login);
    Object.assign(instance, accountData);
    if (accountData.createDateTime) instance.createDateTime = new Date(accountData.createDateTime);
    if (accountData.lastUpdate) instance.lastUpdate = new Date(accountData.lastUpdate);
    return instance;
  }

  // ────────────────────────────────────────────────
  // 🔹 Lógica de extracción principal
  // ────────────────────────────────────────────────

  private async extractAccountDataFromBrokeret(login: string, account: Account): Promise<any> {
    this.logger.debug(`🔍 Extrayendo datos para login ${login}`);

    const now = new Date();
    const endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 2);

    let startDate = new Date(now);
    startDate.setMonth(now.getMonth() - 3);

    if (account?.createDateTime) {
      const challengeStart = new Date(account.createDateTime);
      challengeStart.setMonth(challengeStart.getMonth() - 3);
      startDate = challengeStart;
    }

    const openPositions = await this.getFazoOpenPositionsAsBrokeretFormat(login);
    const closedPositions = await this.getFazoClosedPositionsAsBrokeretFormat(login, startDate, endDate);

    const loginId = this.extractNumericLogin(login) ?? Number(login);
    // Obtener userInfo desde FAZO; desactivar Brokeret Analytics (solo FAZO)
    let userInfo: any = null;
    try {
      userInfo = await this.fazoClient.getUserInfo(loginId);
    } catch (reason: any) {
      this.logger.warn(
        `getUserInfo fallo para login=${loginId}: status=${reason?.response?.status} msg=${reason?.message || reason}`,
      );
    }

    // Brokeret Analytics DESACTIVADO: no llamar a trading/analytics/profitability
    const profitability = { data: {} };

    const data = userInfo?.data ?? userInfo ?? {};
    const balance = Number(data?.balance ?? account.balance?.currentBalance ?? 0);
    const equity = Number(data?.equity ?? account.equity ?? account.balance?.currentBalance ?? 0);

    const userDetails = {
      success: true,
      message: 'User details from FAZO',
      data: { balance, equity },
      timestamp: new Date().toISOString(),
    };

    return {
      login,
      openPositions,
      closedPositions,
      userDetails,
      profitabilityAnalytics: profitability,
      lastUpdate: new Date().toISOString(),
    };
  }
}
