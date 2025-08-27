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

/**
 * Interfaz para los datos extraídos de Brokeret API
 */
export interface BrokeretAccountData {
  login: string;
  openPositions: any;
  closedPositions: any;
  userOrders: any;
  userDetails: any;
  profitabilityAnalytics: any;
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
        updatedAccount.balance = this.mapBalance(brokeretData.userDetails.data, updatedAccount.balance);
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

      // Mapear posiciones cerradas
      if (brokeretData.closedPositions?.data?.deals) {
        updatedAccount.closedPositions = this.mapClosedPositions(
          brokeretData.closedPositions.data.deals,
        );
      } else {
        // Si no hay posiciones cerradas, crear estructura vacía
        updatedAccount.closedPositions = this.mapClosedPositions([]);
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
  private mapBalance(userDetails: any, existingBalance?: Balance): Balance {
    const balance = existingBalance || new Balance();
    
    // Actualizar solo el balance actual desde userDetails
    balance.currentBalance = userDetails.balance || 0;
    
    // NO actualizar initialBalance - es estático desde brokerAccount
    // dailyBalance se actualiza en otro job, no aquí
    
    return balance;
  }

  /**
   * Mapea las posiciones abiertas
   */
  private mapOpenPositions(openPositionsData: any[]): PositionsClassType {
    const positions = openPositionsData.map((pos) => {
      const position = new OpenPosition();
      position.OrderId = pos.ticket || pos.orderID;
      position.Symbol = pos.symbol;
      position.Type = pos.type || pos.cmd;
      position.Volume = pos.volume || pos.lots;
      position.OpenPrice = pos.open_price || pos.openPrice || pos.price;
      position.ClosePrice = pos.current_price || pos.currentPrice;
      position.Profit = pos.profit;
      position.Swap = pos.swap;
      position.TimeOpen = pos.open_time || pos.openTime;
      position.Commentary = pos.comment;
      position.SL = pos.sl || pos.stopLoss;
      position.TP = pos.tp || pos.takeProfit;
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
  private mapClosedPositions(closedPositionsData: any[]): PositionsClassType {
    const positions = closedPositionsData.map((pos) => {
      const position = new ClosedPosition();
      position.OrderId = pos.ticket || pos.orderID;
      position.Symbol = pos.symbol;
      position.Type = pos.type || pos.cmd;
      position.Volume = pos.volume || pos.lots;
      position.OpenPrice = pos.open_price || pos.openPrice || pos.price;
      position.ClosePrice = pos.close_price || pos.closePrice;
      position.Profit = pos.profit;
      position.Swap = pos.swap;
      position.Commission = pos.commission;
      position.Rate = pos.rate;
      position.TimeOpen = pos.open_time || pos.openTime;
      position.TimeClose = pos.close_time || pos.closeTime;
      position.Commentary = pos.comment;
      position.SL = pos.sl || pos.stopLoss;
      position.TP = pos.tp || pos.takeProfit;
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
    userDetails: any,
    profitabilityAnalytics: any,
    existingAccount: Account,
  ): MetaStats {
    // Solo usar more-stats para calcular maxMinBalance
    const moreStats = getMoreStats(existingAccount);
    
    // Mapear métricas promedio directamente desde profitabilityAnalytics de Brokeret
    const averageMetrics = new AverageMetrics();
    const analytics = profitabilityAnalytics?.profitability_metrics;
    
    if (analytics) {
      // Usar datos directos de Brokeret API
      averageMetrics.totalTrades = analytics.total_trades || 0;
      averageMetrics.winningTrades = analytics.winning_trades || 0;
      averageMetrics.losingTrades = analytics.losing_trades || 0;
      averageMetrics.winRate = analytics.win_rate || 0;
      averageMetrics.lossRate = averageMetrics.totalTrades > 0 
        ? ((averageMetrics.losingTrades / averageMetrics.totalTrades) * 100) 
        : 0;
      averageMetrics.averageProfit = analytics.average_win || 0;
      averageMetrics.averageLoss = analytics.average_loss || 0;
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
