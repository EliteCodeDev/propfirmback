export class MaxMinBalance {
  maxBalance: number;
  minBalance: number;
}
export class AverageMetrics {
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  winRate: number;
  lossRate: number;
  averageProfit: number;
  averageLoss: number;

  constructor() {
    this.totalTrades = 0;
    this.winningTrades = 0;
    this.losingTrades = 0;
    this.winRate = 0;
    this.lossRate = 0;
    this.averageProfit = 0;
    this.averageLoss = 0;
  }
}
export class RiskParams {
  profitTarget: number;
  dailyDrawdown: number;
  maxDrawdown: number;
  lossPerTrade?: number;
  tradingDays: number;
  inactiveDays: number;
}
