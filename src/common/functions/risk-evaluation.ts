import { Account, RiskParams } from '../utils';
import {
  calculateProfitTarget,
  calculateDailyTotalDrawdown,
  calculateTradingDays,
  consecutiveInactiveDays,
} from './index';
import { riskEvaluationResult } from '../types/risk-results';

export function riskEvaluation(
  account: Account,
  riskParams: RiskParams,
): riskEvaluationResult {
  const { balance, openPositions, closedPositions } = account;
  const params = riskParams;
  const profitTarget = calculateProfitTarget(
    params.profitTarget,
    balance.currentBalance,
    balance.initialBalance,
  );
  const dailyDrawdown = calculateDailyTotalDrawdown(
    params.dailyDrawdown,
    balance.currentBalance,
    balance.dailyBalance,
  );
  const maxDrawdown = calculateDailyTotalDrawdown(
    params.maxDrawdown,
    balance.currentBalance,
    balance.initialBalance,
  );

  const tradingDays = calculateTradingDays(
    openPositions.open,
    closedPositions.closed,
  );
  const inactiveDays = consecutiveInactiveDays(
    openPositions.open,
    closedPositions.closed,
    account.createDateTime,
    params.inactiveDays,
  );
  return {
    profitTarget,
    dailyDrawdown,
    maxDrawdown,
    tradingDays,
    inactiveDays,
  };
}
