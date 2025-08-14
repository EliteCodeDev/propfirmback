//max balance
//min balance
// avr metrics
//win and loss rates
import {
  OpenPosition,
  ClosedPosition,
  MaxMinBalance,
  AverageMetrics,
  Balance,
  Account,
} from 'src/common/utils';

export function maxMinBalance(
  currentBalance: number,
  equity: number,
  maxMinBalance: MaxMinBalance,
): MaxMinBalance {
  maxMinBalance.maxBalance = Math.max(maxMinBalance.maxBalance, currentBalance);
  maxMinBalance.minBalance = Math.min(maxMinBalance.minBalance, equity);
  return maxMinBalance;
}
export function numTrades(
  openPositions: OpenPosition[],
  closedPositions: ClosedPosition[],
): number {
  return openPositions.length + closedPositions.length;
}
export function averageMetrics(
  openPositions: OpenPosition[],
  closedPositions: ClosedPosition[],
): AverageMetrics {
  const metrics = new AverageMetrics();

  metrics.totalTrades = numTrades(openPositions, closedPositions);
  metrics.winningTrades = closedPositions.filter(
    (pos) => pos.Profit > 0,
  ).length;
  metrics.losingTrades = closedPositions.filter((pos) => pos.Profit < 0).length;

  if (metrics.totalTrades > 0) {
    metrics.winRate = (metrics.winningTrades / metrics.totalTrades) * 100;
    metrics.lossRate = (metrics.losingTrades / metrics.totalTrades) * 100;
  }

  return metrics;
}

export function getMoreStats(account: Account) {
  const { balance, openPositions, closedPositions } = account;
  const metrics = this.averageMetrics(
    openPositions.open,
    closedPositions.closed,
  );
  const maxMinBalance = this.maxMinBalance(
    balance.currentBalance,
    account.metaStats.equity,
    account.metaStats.maxMinBalance,
  );
  const numTrades = this.numTrades(openPositions.open, closedPositions.closed);
}
