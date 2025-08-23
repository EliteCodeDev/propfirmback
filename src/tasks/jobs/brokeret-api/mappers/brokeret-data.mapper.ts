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
  userStats: any;
  totalRisk: any;
  todayRisk: any;
  propStats: any;
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

      // Mapear balance y equity desde userStats
      if (brokeretData.userStats?.result) {
        updatedAccount.balance = this.mapBalance(brokeretData.userStats.result);
        updatedAccount.equity = brokeretData.userStats.result.equity || updatedAccount.equity || 0;
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
        brokeretData.userStats?.result,
        brokeretData.totalRisk?.result,
        brokeretData.todayRisk?.result,
        brokeretData.propStats?.result?.[0],
      );

      // Mapear riskValidation
      updatedAccount.riskValidation = this.mapRiskValidation(
        brokeretData.totalRisk?.result,
        brokeretData.todayRisk?.result,
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
  private mapBalance(userStats: any): Balance {
    const balance = new Balance();
    balance.currentBalance = userStats?.balance || userStats?.current_Balance || 0;
    balance.initialBalance = userStats?.initial_Balance || userStats?.initialBalance || 0;
    balance.dailyBalance = userStats?.daily_Balance || userStats?.dailyBalance || 0;
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
    userStats: any,
    totalRisk: any,
    todayRisk: any,
    propStats: any,
  ): MetaStats {
    // Mapear balance máximo y mínimo
    const maxMinBalance = new MaxMinBalance();
    maxMinBalance.maxBalance = userStats?.max_Balance || userStats?.maxBalance || 0;
    maxMinBalance.minBalance = userStats?.min_Balance || userStats?.minBalance || 0;

    // Mapear métricas promedio
    const averageMetrics = new AverageMetrics();
    averageMetrics.totalTrades = totalRisk?.total_Trades || totalRisk?.totalTrades || 0;
    averageMetrics.winningTrades = totalRisk?.winning_Trades || totalRisk?.winningTrades || 0;
    averageMetrics.losingTrades = totalRisk?.losing_Trades || totalRisk?.losingTrades || 0;
    averageMetrics.winRate = totalRisk?.win_Rate || totalRisk?.winRate || 0;
    averageMetrics.lossRate = totalRisk?.loss_Rate || totalRisk?.lossRate || 0;
    averageMetrics.averageProfit = totalRisk?.average_Profit || totalRisk?.averageProfit || 0;
    averageMetrics.averageLoss = totalRisk?.average_Loss || totalRisk?.averageLoss || 0;

    const metaStats = new MetaStats();
    metaStats.equity = userStats?.equity || 0;
    metaStats.maxMinBalance = maxMinBalance;
    metaStats.averageMetrics = averageMetrics;
    metaStats.numTrades = totalRisk?.total_Trades || totalRisk?.totalTrades || 0;
    
    return metaStats;
  }

  /**
   * Mapea la validación de riesgo
   */
  private mapRiskValidation(totalRisk: any, todayRisk: any): RiskValidation {
    const riskValidation = new RiskValidation();
    
    // Mapear las propiedades que existen en RiskValidation
    riskValidation.profitTarget = totalRisk?.profit_Target || totalRisk?.profitTarget || 0;
    riskValidation.dailyDrawdown = totalRisk?.daily_Drawdown || totalRisk?.dailyDrawdown || 0;
    riskValidation.maxDrawdown = totalRisk?.max_Drawdown || totalRisk?.maxDrawdown || 0;
    riskValidation.tradingDays = totalRisk?.trading_Days || totalRisk?.tradingDays || 0;
    riskValidation.inactiveDays = totalRisk?.inactive_Days || totalRisk?.inactiveDays || 0;
    
    return riskValidation;
  }


}