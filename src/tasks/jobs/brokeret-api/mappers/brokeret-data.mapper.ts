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
import { riskEvaluation } from 'src/common/functions/risk-evaluation';
import { riskEvaluationResult } from 'src/common/types/risk-results';
import {
  OpenPositionsResponse,
  ClosedPositionsResponse,
  UserDetailsResponse,
  ProfitabilityAnalyticsResponse,
} from 'src/modules/data/brokeret-api/types/response.type';

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
          `BrokeretDataMapper: No hay respuesta de API para cuenta ${existingAccount.login}, realizando operaciones de riesgo con data existente`,
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
      const newOpenPositions =
        brokeretData.openPositions?.data?.positions || [];
      const existingOpenPositions =
        updatedAccount.openPositions?.positions || [];
      const newClosedPositions =
        brokeretData.closedPositions?.data?.deals || [];
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
          const closedOrderIds = newClosedPositions.map(
            (pos: any) => pos.order,
          );
          // this.logger.debug(
          //   `BrokeretDataMapper: Mapeando posiciones cerradas para cuenta ${brokeretData.login} : ${JSON.stringify(closedOrderIds)}`,
          // );
          const missingPositions = existingOrderIds.filter(
            (orderId) => !closedOrderIds.includes(orderId as Number),
          );

          if (missingPositions.length > 0) {
            // 2.1.2.2: Error - posiciones no cerradas pero no aparecen en la data nueva
            this.logger.error(
              `BrokeretDataMapper: Error en cuenta ${brokeretData.login} - Posiciones abiertas ${missingPositions.join(', ')} no aparecen en closed positions ni en open positions`,
            );
            // Mantener las posiciones existentes y marcar como error
            updatedAccount.openPositions = updatedAccount.openPositions;
            updatedAccount.saved = false;
            updatedAccount.updated = false;
            return updatedAccount;
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

      // REGLA 2.2: Validación para posiciones cerradas
      const existingClosedCount =
        updatedAccount.closedPositions?.positions?.length || 0;
      const newClosedCount = newClosedPositions.length;

      if (newClosedCount > existingClosedCount) {
        // Hay más posiciones cerradas en la nueva data, actualizar
        this.logger.debug(
          `BrokeretDataMapper: Actualizando posiciones cerradas para cuenta ${brokeretData.login} - de ${existingClosedCount} a ${newClosedCount}`,
        );
        updatedAccount.closedPositions =
          this.mapClosedPositions(newClosedPositions);
      } else if (
        newClosedCount < existingClosedCount &&
        existingClosedCount > 0
      ) {
        // Hay menos posiciones cerradas en la nueva data, error
        this.logger.error(
          `BrokeretDataMapper: Error en cuenta ${brokeretData.login} - Nueva data tiene menos posiciones cerradas (${newClosedCount}) que las existentes (${existingClosedCount})`,
        );
        // Mantener las posiciones existentes y marcar como error
        updatedAccount.saved = false;
        updatedAccount.updated = false;
        return updatedAccount;
      } else if (newClosedCount === 0 && existingClosedCount === 0) {
        // No hay posiciones cerradas en ningún lado, crear estructura vacía
        updatedAccount.closedPositions = this.mapClosedPositions([]);
      } else {
        // Mismo número de posiciones, actualizar normalmente
        if (newClosedCount > 0) {
          updatedAccount.closedPositions =
            this.mapClosedPositions(newClosedPositions);
        }
        // Si newClosedCount === 0 pero existingClosedCount > 0, mantener existentes (ya manejado arriba)
      }

      // Mapear metaStats (métricas combinadas)
      updatedAccount.metaStats = this.mapMetaStats(
        brokeretData.userDetails?.data,
        brokeretData.profitabilityAnalytics?.data,
        updatedAccount,
      );

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
    openPositionsData: OpenPositionsResponse['data']['positions'],
  ): PositionsClassType {
    const positions = openPositionsData.map((pos) => {
      const position = new OpenPosition();
      position.OrderId = pos.ticket.toString();
      position.Symbol = pos.symbol;
      position.Type = pos.action_name;
      position.Volume = pos.volume;
      position.OpenPrice = pos.price_open;
      position.ClosePrice = pos.price_current;
      position.Profit = pos.profit;
      position.Swap = pos.swap;
      position.TimeOpen = pos.time_create;
      position.Commentary = pos.comment;
      position.SL = pos.price_sl;
      position.TP = pos.price_tp;
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
      position.OrderId = pos.order.toString();
      position.Symbol = pos.symbol;
      position.Type = pos.action;
      position.Volume = pos.volume;
      position.OpenPrice = pos.price_open;
      position.ClosePrice = pos.price_close;
      position.Profit = pos.profit;
      position.Swap = pos.swap;
      position.Commission = pos.commission;
      position.Rate = 1; // No disponible en la estructura, usar valor por defecto
      position.TimeOpen = pos.time_open;
      position.TimeClose = pos.time_close;
      position.Commentary = pos.comment;
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
   * Mapea las métricas combinadas (metaStats)
   */
  private mapMetaStats(
    userDetails: UserDetailsResponse['data'] | undefined,
    profitabilityAnalytics: ProfitabilityAnalyticsResponse['data'] | undefined,
    existingAccount: Account,
  ): MetaStats {
    // Solo usar more-stats para calcular maxMinBalance
    const moreStats = getMoreStats(existingAccount);

    // Mapear métricas promedio directamente desde profitabilityAnalytics de Brokeret
    const averageMetrics = new AverageMetrics();
    const analytics = profitabilityAnalytics?.profitability_metrics;

    if (analytics) {
      // Usar datos directos de Brokeret API
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
    }

    const metaStats = new MetaStats();
    // Usar equity directamente de userDetails de Brokeret
    metaStats.equity = userDetails?.equity || 0;
    // Solo usar more-stats para maxMinBalance (que requiere cálculo histórico)
    metaStats.maxMinBalance = moreStats.maxMinBalance;
    // Usar averageMetrics mapeados directamente de Brokeret
    metaStats.averageMetrics = averageMetrics;
    // Usar numTrades directamente de Brokeret
    metaStats.numTrades = analytics?.total_trades || 0;

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
    validation.tradingDays = riskEvaluationResult.tradingDays.numDays;
    validation.inactiveDays = riskEvaluationResult.inactiveDays.inactiveDays;
    return validation;
  }
}
