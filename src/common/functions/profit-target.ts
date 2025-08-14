import { profitTargetResult } from '../types/risk-results';
export function calculateProfitTarget(
  paramProfitTarget: number, // Profit target parameter (in numeric % e.g 5 = 5%)
  currentBalance: number, // daily or initial balance
  initialBalance: number,
): profitTargetResult {
  const profit = ((currentBalance - initialBalance) / initialBalance) * 100;
  return {
    status: profit > paramProfitTarget,
    profit,
    profitTarget: paramProfitTarget,
  };
}
