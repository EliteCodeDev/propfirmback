// dailyTotalDrawdown
interface dailyMaxDrawdownResult {
  status: boolean;
  drawdown: number;
}

export function calculateDailyTotalDrawdown(
  equity: any, // float balance
  paramDailyDrawdown: number, // Daily drawdown parameter (in numeric % e.g 5 = 5%)
  balance: number, // daily or initial balance
): dailyMaxDrawdownResult {
  // Implement logic to calculate daily total drawdown
  const result = ((equity - balance) / balance) * 100;
  return {
    status: result > paramDailyDrawdown,
    drawdown: result,
  };
}
