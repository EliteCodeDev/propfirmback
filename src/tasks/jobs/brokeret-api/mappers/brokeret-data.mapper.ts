import { Injectable, Logger } from '@nestjs/common';
import {
  Account,
  Balance,
  MetaStats,
  PositionsClassType,
  OpenPosition,
  ClosedPosition,
  MaxMinBalance,
  AverageMetrics,
  RiskParams,
} from 'src/common/utils';
import { getMoreStats } from 'src/common/functions/more-stats';
import { riskEvaluationResult } from 'src/common/types/risk-results';
import {
  OpenPositionsResponse,
  ClosedPositionsResponse,
  UserDetailsResponse,
  ProfitabilityAnalyticsResponse,
} from 'src/modules/data/brokeret-api/types/response.type';
import { isEmpty } from 'class-validator';
import { riskEvaluation } from 'src/common/functions/risk-evaluation';

/**
 * Interfaz para las órdenes de usuario (userOrders)
 */
export interface UserOrdersResponse {
  success: boolean;
  message: string;
  data: {
    login: number;
    orders: {
      ticket: number;
      login: number;
      symbol: string;
      action: number;
      action_name: string;
      volume: number;
      price_open: number;
      price_sl: number;
      price_tp: number;
      time_create: string;
      time_expiration: string;
      comment: string;
    }[];
    summary: {
      total_orders: number;
      total_volume: number;
    };
  };
  total_count: number;
  timestamp: string | null;
}

/**
 * Interfaz completa para los datos extraídos de Brokeret API
 */
export interface BrokeretAccountData {
  login: string;
  openPositions: OpenPositionsResponse;
  closedPositions: ClosedPositionsResponse;
  userOrders: UserOrdersResponse;
  userDetails: UserDetailsResponse;
  profitabilityAnalytics: ProfitabilityAnalyticsResponse;
  lastUpdate: string;
}

@Injectable()
export class BrokeretDataMapper {
  private readonly logger = new Logger(BrokeretDataMapper.name);

  async mapBrokeretDataToAccount(
    existingAccount: Account,
    brokeretData: BrokeretAccountData | null,
  ): Promise<Account> {
    try {
      this.logger.debug(
        `BrokeretDataMapper: Mapeando datos para cuenta ${existingAccount.login}`,
      );

      // Trabajar directamente con la instancia existente
      const updatedAccount = existingAccount;

      // REGLA 1: Si no hay respuesta de la API, realizar operaciones de riesgo y guardado
      if (!brokeretData) {
        this.logger.debug(
          `BrokeretDataMapper: No hay respuesta de API para cuenta ${existingAccount.login}, no se actualizará la cuenta`,
        );

        return updatedAccount;
      }

      // Actualizar timestamp
      updatedAccount.lastUpdate = new Date(brokeretData.lastUpdate);

      // Mapear balance y equity desde userDetails
      if (brokeretData.userDetails?.data) {
        updatedAccount.balance = this.mapBalance(
          brokeretData.userDetails.data,
          updatedAccount.balance,
        );
        updatedAccount.equity =
          brokeretData.userDetails.data.equity || updatedAccount.equity;
      }

      // REGLA 2.1: Validación para posiciones abiertas
      // Soporte flexible para Fazo o Brokeret (ambos formatos posibles)
      // Soporte flexible para Fazo o Brokeret (ambos formatos posibles)
      const newOpenPositions = (
        brokeretData.openPositions?.data?.positions ||
        (brokeretData.openPositions as any)?.positions ||
        (brokeretData.openPositions as any)?.openPositions ||
        []
      ) as OpenPositionsResponse['data']['positions'];
      // Log de depuración opcional (puedes dejarlo temporalmente)
      this.logger.debug(
        `[BrokeretDataMapper] ${brokeretData.login}: posiciones abiertas detectadas = ${newOpenPositions.length}`,
      );

      const existingOpenPositions =
        updatedAccount.openPositions?.positions || [];
      // Cerradas desde API: aplicar un filtro defensivo para evitar mezclar abiertas
      const newClosedPositions = (
        brokeretData.closedPositions?.data?.deals || []
      ).filter((pos: any) => {
        const tc = (pos as any).time_close ?? (pos as any).closetime ?? (pos as any).close_time ?? (pos as any).closeTime;
        const pc = Number((pos as any).price_close ?? (pos as any).price);
        return (typeof tc === 'string' && tc.length > 0) || (typeof tc === 'number' && tc > 0) || (Number.isFinite(pc) && pc !== 0);
      });
      // this.logger.debug(
      //   `BrokeretDataMapper: Mapeando posiciones abiertas para cuenta ${brokeretData.login} : ${JSON.stringify(newClosedPositions)}`,
      // );
      if (newOpenPositions.length === 0) {
        // 2.1.1: Si no había posiciones abiertas en el buffer, seguir con normalidad
        if (existingOpenPositions.length === 0) {
          this.logger.debug(
            `BrokeretDataMapper: No hay posiciones abiertas nuevas ni existentes para cuenta ${brokeretData.login}`,
          );
          updatedAccount.openPositions = this.mapOpenPositions([]);
        } else {
          // 2.1.2: Si había posiciones abiertas en el buffer, verificar si están en closed positions
          const existingOrderIds = existingOpenPositions.map(
            (pos: OpenPosition) => parseInt(pos.OrderId),
          );
          // this.logger.debug(
          //   `BrokeretDataMapper: Mapeando posiciones existentes para cuenta ${brokeretData.login} : ${JSON.stringify(existingOrderIds)}`,
          // );
          // Normalizar IDs de órdenes cerradas a números primitivos
          const closedOrderIds = newClosedPositions.map(
            (pos: any) => Number(pos.order),
          );
          // this.logger.debug(
          //   `BrokeretDataMapper: Mapeando posiciones cerradas para cuenta ${brokeretData.login} : ${JSON.stringify(closedOrderIds)}`,
          // );
          // Comparar correctamente números primitivos para detectar órdenes faltantes
          const missingPositions = existingOrderIds.filter(
            (orderId) => !closedOrderIds.includes(Number(orderId)),
          );

          if (missingPositions.length > 0) {
            // 2.1.2.2: Error - posiciones no cerradas pero no aparecen en la data nueva
            this.logger.error(
              `BrokeretDataMapper: Error en cuenta ${brokeretData.login} - Posiciones abiertas ${missingPositions.join(', ')} no aparecen en closed positions ni en open positions`,
            );
            // Mantener las posiciones existentes y continuar sin bloquear el guardado
            // (permitimos que otras partes del account se persistan y que el cierre
            // se refleje cuando llegue en la API)
            updatedAccount.openPositions = updatedAccount.openPositions;
          } else {
            // 2.1.2.1: Las posiciones fueron cerradas correctamente
            this.logger.debug(
              `BrokeretDataMapper: Posiciones abiertas de cuenta ${brokeretData.login} fueron cerradas correctamente`,
            );
            updatedAccount.openPositions = this.mapOpenPositions([]);
          }
        }
      } else {
        // Hay posiciones abiertas nuevas, mapear normalmente
        updatedAccount.openPositions = this.mapOpenPositions(newOpenPositions);
      }

      // REGLA 2.2: Fusión de posiciones cerradas (API + existentes) por OrderId
      const existingClosed = (
        (updatedAccount.closedPositions?.positions as ClosedPosition[]) || []
      ).filter((p) => p && typeof (p as any).TimeClose === 'string');
      const newClosedCount = newClosedPositions.length;

      if (newClosedCount === 0) {
        if (existingClosed.length === 0) {
          // No hay posiciones cerradas en ningún lado, crear estructura vacía
          updatedAccount.closedPositions = this.mapClosedPositions([]);
        } else {
          // Mantener las existentes cuando la API trae vacío
          const positionsClass = new PositionsClassType();
          positionsClass.setPositions(existingClosed);
          positionsClass.setLenght(existingClosed.length);
          updatedAccount.closedPositions = positionsClass;
        }
      } else {
        // Mapear nuevas cerradas desde API
        const newClosedClass = this.mapClosedPositions(newClosedPositions);
        const newClosed = (newClosedClass.getPositions() || []) as ClosedPosition[];

        // Construir diccionario por OrderId y fusionar con preferencia por nuevas entradas
        const byOrder: Record<string, ClosedPosition> = {};
        for (const p of existingClosed) {
          if (!p || !p.OrderId) continue;
          byOrder[String(p.OrderId)] = p;
        }
        for (const p of newClosed) {
          if (!p || !p.OrderId) continue;
          const key = String(p.OrderId);
          // Si existe, reemplazar por la nueva (asumimos datos más frescos de API)
          byOrder[key] = p;
        }

        // Eliminar de cerradas cualquier orden que aún esté abierta para evitar duplicación visual
        const openIdsSet = new Set(
          ((updatedAccount.openPositions?.positions as OpenPosition[]) || [])
            .map((op) => (op?.OrderId !== undefined ? String(op.OrderId) : ''))
            .filter((id) => id && id.length > 0),
        );
        const merged = Object.values(byOrder)
          .filter((p) => !openIdsSet.has(String(p.OrderId)))
          .sort((a, b) => {
          const ta = new Date(a.TimeClose || a.TimeOpen || 0).getTime();
          const tb = new Date(b.TimeClose || b.TimeOpen || 0).getTime();
          return ta - tb;
        });

        const positionsClass = new PositionsClassType();
        positionsClass.setPositions(merged);
        positionsClass.setLenght(merged.length);
        updatedAccount.closedPositions = positionsClass;
      }

      // Mapear metaStats (métricas combinadas)
      updatedAccount.metaStats = this.mapMetaStats(
        brokeretData.userDetails?.data,
        brokeretData.profitabilityAnalytics?.data,
        updatedAccount,
      );

      // Evaluar riesgo para actualizar reglas (daily drawdown y max drawdown)
      try {
        if (updatedAccount.riskValidation) {
          const evalResult = riskEvaluation(
            updatedAccount,
            updatedAccount.riskValidation,
          );
          updatedAccount.rulesEvaluation = evalResult;
          // Reflejar tradingDays en metaStats para consumo del front
          if (updatedAccount.metaStats) {
            (updatedAccount.metaStats as any).tradingDays =
              evalResult.tradingDays?.numDays ?? 0;
          }
        } else {
          this.logger.warn(
            `BrokeretDataMapper: Cuenta ${updatedAccount.login} sin riskValidation; no se evalúan reglas`,
          );
        }
      } catch (e) {
        this.logger.error(
          `BrokeretDataMapper: Error evaluando riesgo para ${updatedAccount.login}: ${e?.message || e}`,
        );
      }

      // NO actualizar riskValidation - se mantiene desde el challenge original
      // riskValidation contiene los parámetros de evaluación que no cambian

      this.logger.debug(
        `BrokeretDataMapper: Datos mapeados exitosamente para cuenta ${brokeretData.login}`,
      );

      return updatedAccount;
    } catch (error) {
      this.logger.error(
        `BrokeretDataMapper: Error mapeando datos para cuenta ${brokeretData.login}:`,
        error,
      );
      throw error;
    }
  }

  /**
   * Mapea el balance de la cuenta
   */
  private mapBalance(
    userDetails: UserDetailsResponse['data'],
    existingBalance?: Balance,
  ): Balance {
    const balance = existingBalance || new Balance();

    // Actualizar solo el balance actual desde userDetails
    balance.currentBalance = userDetails.balance;

    // NO actualizar initialBalance - es estático desde brokerAccount
    // dailyBalance se actualiza en otro job, no aquí

    return balance;
  }

  /**
   * Mapea las posiciones abiertas
   */
  private mapOpenPositions(
    openPositionsData: any[],
  ): PositionsClassType {
    const positions = openPositionsData.map((pos) => {
      const position = new OpenPosition();

      // Usa el ID correcto (Fazo/Brokeret)
      position.OrderId = String(pos.ticket ?? pos.positionid ?? pos.dealId ?? pos.id);

      // Datos del símbolo y tipo
      position.Symbol = pos.symbol;
      const typeRaw = (pos.action_name ?? pos.type ?? '').toString().toUpperCase();
      position.Type = typeRaw === 'SELL' ? 'SELL' : 'BUY';
      position.Volume = Number(pos.volume ?? pos.lotsize ?? 0);

      // Precios
      position.OpenPrice = Number(pos.price_open ?? pos.price ?? 0);
      position.ClosePrice = null; // 🚫 nunca asignar para abiertas

      // SL/TP (cuando estén disponibles)
      position.SL = Number(pos.price_sl ?? 0);
      position.TP = Number(pos.price_tp ?? 0);

      // Profit: tomar directo si viene, o calcular si hay price_current
      if (typeof pos.profit === 'number' && !isNaN(pos.profit)) {
        position.Profit = pos.profit;
      } else {
        const priceCurrent = Number(pos.price_current ?? pos.currentPrice ?? 0);
        const priceOpen = Number(pos.price_open ?? pos.price ?? 0);
        const volume = Number(pos.volume ?? pos.lotsize ?? 0);
        const isSell = typeRaw === 'SELL';
        position.Profit = isSell
          ? (priceOpen - priceCurrent) * volume
          : (priceCurrent - priceOpen) * volume;
      }

      position.Swap = pos.swap ?? 0;
      position.Commentary = pos.comment ?? '';
      position.TimeOpen = pos.time_create;
      return position;
    });

    const positionsClass = new PositionsClassType();
    positionsClass.setPositions(positions);
    positionsClass.setLenght(positions.length);
    return positionsClass;
  }


  /**
   * Mapea las posiciones cerradas
   */
  private mapClosedPositions(
    closedPositionsData: ClosedPositionsResponse['data']['deals'],
  ): PositionsClassType {
    const positions = closedPositionsData.map((pos) => {
      const position = new ClosedPosition();
      position.OrderId = String(pos.order ?? pos.ticket);
      position.Symbol = pos.symbol;
      const typeRaw = (pos.action ?? pos.action_name ?? '').toString().toUpperCase();
      position.Type = typeRaw === 'SELL' ? 'SELL' : 'BUY';
      position.Volume = Number(pos.volume ?? 0);
      position.OpenPrice = Number(pos.price_open ?? 0);
      position.ClosePrice = Number(pos.price_close ?? 0);
      position.Profit = Number(pos.profit ?? 0);
      position.Swap = Number(pos.swap ?? 0);
      position.Commission = Number(pos.commission ?? 0);
      position.Rate = 1; // No disponible en la estructura, usar valor por defecto
      // Normalizar timestamps a ISO (UTC) para consistencia con WS y DB
      position.TimeOpen = this.normalizeTimestamp(
        (pos as any).time_open ?? (pos as any).opentime ?? (pos as any).open_time ?? (pos as any).openTime ?? (pos as any).time_create ?? (pos as any).time,
      );
      position.TimeClose = this.normalizeTimestamp(
        (pos as any).time_close ?? (pos as any).closetime ?? (pos as any).close_time ?? (pos as any).closeTime ?? (pos as any).time,
      );
      position.Commentary = (pos as any).comment ?? '';
      position.SL = 0; // No disponible en posiciones cerradas transformadas
      position.TP = 0; // No disponible en posiciones cerradas transformadas
      return position;
    });

    const positionsClass = new PositionsClassType();
    positionsClass.setPositions(positions);
    positionsClass.setLenght(positions.length);
    return positionsClass;
  }

  /**
   * Normaliza timestamps (segundos, milisegundos o cadenas) a ISO UTC.
   * Devuelve string ISO o null si no es parseable.
   */
  private normalizeTimestamp(raw: any): string | null {
    if (raw === null || raw === undefined) return null;
    try {
      if (typeof raw === 'number') {
        const ms = raw > 1e12 ? raw : raw * 1000; // segundos vs milisegundos
        return new Date(ms).toISOString();
      }
      if (typeof raw === 'string') {
        const num = Number(raw);
        if (!isNaN(num)) {
          const ms = num > 1e12 ? num : num * 1000;
          return new Date(ms).toISOString();
        }
        const d = new Date(raw);
        return isNaN(d.getTime()) ? null : d.toISOString();
      }
      if (raw instanceof Date) {
        return isNaN(raw.getTime()) ? null : raw.toISOString();
      }
      return null;
    } catch {
      return null;
    }
  }

  /**
   * Mapea las métricas combinadas (metaStats)
   */
  private mapMetaStats(
    userDetails: UserDetailsResponse['data'] | undefined,
    profitabilityAnalytics: ProfitabilityAnalyticsResponse['data'] | undefined,
    existingAccount: Account,
  ): MetaStats {
    // Obtener siempre moreStats (contiene fallback calculado localmente)
    const moreStats = getMoreStats(existingAccount);

    const metaStats = new MetaStats();
    metaStats.equity = userDetails?.equity || 0;
    metaStats.maxMinBalance = moreStats.maxMinBalance; // histórico local

    // Preparar estructura de métricas promedio
    const averageMetrics = new AverageMetrics();
    const analytics = profitabilityAnalytics?.profitability_metrics;
    const analyticsIsEmpty =
      !analytics ||
      isEmpty(analytics) ||
      (typeof analytics === 'object' && Object.keys(analytics).length === 0);

    if (!analyticsIsEmpty) {
      // Datos provenientes de Brokeret API
      averageMetrics.totalTrades = analytics.total_trades;
      averageMetrics.winningTrades = analytics.winning_trades;
      averageMetrics.losingTrades = analytics.losing_trades;
      averageMetrics.winRate = analytics.win_rate;
      averageMetrics.lossRate =
        averageMetrics.totalTrades > 0
          ? (averageMetrics.losingTrades / averageMetrics.totalTrades) * 100
          : 0;
      averageMetrics.averageProfit = analytics.average_win;
      averageMetrics.averageLoss = analytics.average_loss;
      metaStats.numTrades = analytics.total_trades;
    } else {
      // Fallback: calcular con funciones locales (solo campos que proveería analytics)
      averageMetrics.totalTrades = moreStats.metrics.totalTrades;
      averageMetrics.winningTrades = moreStats.metrics.winningTrades;
      averageMetrics.losingTrades = moreStats.metrics.losingTrades;
      averageMetrics.winRate = moreStats.metrics.winRate;
      averageMetrics.lossRate = moreStats.metrics.lossRate;

      // Calcular averageProfit y averageLoss manualmente a partir de posiciones cerradas
      const closedPositions =
        (existingAccount.closedPositions?.positions as ClosedPosition[]) || [];
      const winningProfits = closedPositions
        .filter((p) => p.Profit > 0)
        .map((p) => p.Profit);
      const losingProfits = closedPositions
        .filter((p) => p.Profit < 0)
        .map((p) => p.Profit);
      averageMetrics.averageProfit =
        winningProfits.length > 0
          ? winningProfits.reduce((a, b) => a + b, 0) / winningProfits.length
          : 0;
      averageMetrics.averageLoss =
        losingProfits.length > 0
          ? losingProfits.reduce((a, b) => a + b, 0) / losingProfits.length
          : 0; // normalmente negativo
      metaStats.numTrades = moreStats.metrics.totalTrades;
    }

    metaStats.averageMetrics = averageMetrics;
    return metaStats;
  }

  /**
   * Mapea el resultado de evaluación de riesgo a RiskValidation
   * @param riskEvaluationResult Resultado de la evaluación
   * @returns RiskParams para guardar en la cuenta
   */
  private mapToRiskValidation(
    riskEvaluationResult: riskEvaluationResult,
  ): RiskParams {
    const validation = new RiskParams();
    validation.profitTarget = riskEvaluationResult.profitTarget.profit;
    validation.dailyDrawdown = riskEvaluationResult.dailyDrawdown.drawdown;
    validation.maxDrawdown = riskEvaluationResult.maxDrawdown.drawdown;
    validation.tradingDays = riskEvaluationResult.tradingDays.numDays;
    validation.inactiveDays = riskEvaluationResult.inactiveDays.inactiveDays;
    return validation;
  }
}
