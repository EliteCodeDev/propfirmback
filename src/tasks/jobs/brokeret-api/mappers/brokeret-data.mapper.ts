import { Injectable, Logger } from '@nestjs/common';
import {
  Account,
  Balance,
  MetaStats,
  RiskValidation,
  PositionsClassType,
  OpenPosition,
  ClosedPosition,
  MaxMinBalance,
  AverageMetrics,
  RiskParams,
} from 'src/common/utils';

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
      if (brokeretData.userDetails?.result) {
        updatedAccount.balance = this.mapBalance(brokeretData.userDetails.result);
        updatedAccount.equity = brokeretData.userDetails.result.equity || updatedAccount.equity || 0;
      }

      // Mapear posiciones abiertas
      if (brokeretData.openPositions?.result?.openPositionModel) {
        updatedAccount.openPositions = this.mapOpenPositions(
          brokeretData.openPositions.result.openPositionModel,
        );
      }

      // Mapear posiciones cerradas
      if (brokeretData.closedPositions?.result?.closedPositions) {
        updatedAccount.closedPositions = this.mapClosedPositions(
          brokeretData.closedPositions.result.closedPositions,
        );
      }

      // Mapear metaStats (métricas combinadas)
      updatedAccount.metaStats = this.mapMetaStats(
        brokeretData.userDetails?.result,
        brokeretData.profitabilityAnalytics?.result,
      );

      // Mapear riskValidation
      updatedAccount.riskValidation = this.mapRiskValidation(
        brokeretData.profitabilityAnalytics?.result,
      );

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
  private mapBalance(userDetails: any): Balance {
    const balance = new Balance();
    balance.currentBalance = userDetails?.balance || userDetails?.current_Balance || 0;
    balance.initialBalance = userDetails?.initial_Balance || userDetails?.initialBalance || 0;
    balance.dailyBalance = userDetails?.daily_Balance || userDetails?.dailyBalance || 0;
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
  ): MetaStats {
    // Mapear balance máximo y mínimo desde userDetails
    const maxMinBalance = new MaxMinBalance();
    maxMinBalance.maxBalance = userDetails?.max_Balance || userDetails?.maxBalance || userDetails?.balance || 0;
    maxMinBalance.minBalance = userDetails?.min_Balance || userDetails?.minBalance || userDetails?.balance || 0;

    // Mapear métricas promedio desde profitabilityAnalytics
    const averageMetrics = new AverageMetrics();
    const analytics = profitabilityAnalytics?.metrics || profitabilityAnalytics;
    averageMetrics.totalTrades = analytics?.total_trades || analytics?.totalTrades || 0;
    averageMetrics.winningTrades = analytics?.winning_trades || analytics?.winningTrades || 0;
    averageMetrics.losingTrades = analytics?.losing_trades || analytics?.losingTrades || 0;
    averageMetrics.winRate = analytics?.win_rate || analytics?.winRate || 0;
    averageMetrics.lossRate = analytics?.loss_rate || analytics?.lossRate || 0;
    averageMetrics.averageProfit = analytics?.average_profit || analytics?.averageProfit || 0;
    averageMetrics.averageLoss = analytics?.average_loss || analytics?.averageLoss || 0;

    const metaStats = new MetaStats();
    metaStats.equity = userDetails?.equity || 0;
    metaStats.maxMinBalance = maxMinBalance;
    metaStats.averageMetrics = averageMetrics;
    metaStats.numTrades = analytics?.total_trades || analytics?.totalTrades || 0;
    
    return metaStats;
  }

  /**
   * Mapea la validación de riesgo
   */
  private mapRiskValidation(profitabilityAnalytics: any): RiskValidation {
    const riskValidation = new RiskValidation();
    
    // Mapear las propiedades que existen en RiskValidation desde profitabilityAnalytics
    const analytics = profitabilityAnalytics?.metrics || profitabilityAnalytics;
    riskValidation.profitTarget = analytics?.profit_target || analytics?.profitTarget || 0;
    riskValidation.dailyDrawdown = analytics?.daily_drawdown || analytics?.dailyDrawdown || 0;
    riskValidation.maxDrawdown = analytics?.max_drawdown || analytics?.maxDrawdown || 0;
    riskValidation.tradingDays = analytics?.trading_days || analytics?.tradingDays || 0;
    riskValidation.inactiveDays = analytics?.inactive_days || analytics?.inactiveDays || 0;
    
    return riskValidation;
  }


}