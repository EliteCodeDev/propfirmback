import { ac } from '@faker-js/faker/dist/airline-CLphikKp';
import { Account, RiskParams } from '../utils';
import {
  calculateProfitTarget,
  calculateDailyTotalDrawdown,
  calculateTradingDays,
  consecutiveInactiveDays,
} from './index';

export function riskEvaluation(account: Account, riskParams: RiskParams) {
  const { balance, metaStats, riskValidation, openPositions, closedPositions } =
    account;
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
}
