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
} from 'src/common/utils';
import { getMoreStats } from 'src/common/functions/more-stats';
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

  /**
   * Mapea los datos de Brokeret API al formato del Account del buffer
   */
  async mapBrokeretDataToAccount(
    existingAccount: Account,
    brokeretData: BrokeretAccountData,
  ): Promise<Account> {
    try {
      this.logger.debug(
        `BrokeretDataMapper: Mapeando datos para cuenta ${brokeretData.login}`,
      );

      // Trabajar directamente con la instancia existente
      const updatedAccount = existingAccount;

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

      // Mapear posiciones abiertas
      if (brokeretData.openPositions?.data?.positions) {
        updatedAccount.openPositions = this.mapOpenPositions(
          brokeretData.openPositions.data.positions,
        );
      } else {
        // Si no hay posiciones abiertas, crear estructura vacía
        updatedAccount.openPositions = this.mapOpenPositions([]);
      }

      // Mapear posiciones cerradas con validación para evitar sobrescribir datos existentes con datos vacíos
      if (brokeretData.closedPositions?.data?.deals) {
        updatedAccount.closedPositions = this.mapClosedPositions(
          brokeretData.closedPositions.data.deals,
        );
      } else {
        // Validar si ya existen posiciones cerradas previas
        const hasExistingClosedPositions =
          updatedAccount.closedPositions?.positions &&
          updatedAccount.closedPositions.positions.length > 0;

        if (hasExistingClosedPositions) {
          // Si ya existen posiciones cerradas y llegan datos vacíos, no sobrescribir
          this.logger.debug(
            `BrokeretDataMapper: Omitiendo actualización de posiciones cerradas vacías para cuenta ${brokeretData.login} - datos previos existen (${updatedAccount.closedPositions.positions.length} posiciones)`,
          );
          // Mantener las posiciones cerradas existentes sin cambios
        } else {
          // Si no hay posiciones cerradas previas, crear estructura vacía
          updatedAccount.closedPositions = this.mapClosedPositions([]);
        }
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
}
