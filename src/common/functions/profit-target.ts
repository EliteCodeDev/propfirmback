import { profitTargetResult } from '../types/risk-results';
export function calculateProfitTarget(
  paramProfitTarget: number, // Profit target parameter (in numeric % e.g 5 = 5%)
  currentBalance: number, // daily or initial balance
  initialBalance: number,
): profitTargetResult {
  // Evitar NaN/Infinity si initialBalance no está disponible o es inválido
  if (initialBalance == null || initialBalance <= 0 || currentBalance == null) {
    return {
      status: false,
      profit: 0,
      profitTarget: paramProfitTarget ?? 0,
    };
  }
  const profit = ((currentBalance - initialBalance) / initialBalance) * 100;
  return {
    status: profit > paramProfitTarget,
    profit,
    profitTarget: paramProfitTarget,
  };
}
