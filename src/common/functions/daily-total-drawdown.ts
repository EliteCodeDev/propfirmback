// dailyTotalDrawdown
import { dailyTotalDrawdownResult } from '../types/risk-results';

export function calculateDailyTotalDrawdown(
  paramDailyDrawdown: number, // Threshold in % (e.g., 5 = 5%)
  currentBalance: number, // Current equity/balance
  referenceBalance: number, // Start-of-day or initial balance
): dailyTotalDrawdownResult {
  // Guard against invalid reference balance to avoid NaN/Infinity
  if (referenceBalance == null || referenceBalance <= 0 || currentBalance == null) {
    return {
      status: false,
      drawdown: 0,
    };
  }

  // Compute drawdown as positive percentage loss from the reference balance
  const raw = ((referenceBalance - currentBalance) / referenceBalance) * 100;
  const drawdown = Math.max(0, raw);

  return {
    status: drawdown <= (paramDailyDrawdown ?? 0),
    drawdown,
  };
}
