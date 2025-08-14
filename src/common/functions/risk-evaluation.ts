import { ac } from '@faker-js/faker/dist/airline-CLphikKp';
import { Account } from '../utils';
import {
  calculateProfitTarget,
  calculateDailyTotalDrawdown,
  calculateTradingDays,
  consecutiveInactiveDays,
} from './index';

export function riskEvaluation(account: Account, riskParams: RiskParams) {
  const { balance, dailyTotalDrawdown, tradingDays, inactiveDays } = account;

  const profitTarget = calculateProfitTarget(balance);
}
