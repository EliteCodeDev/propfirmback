// dailyTotalDrawdown
export function calculateDailyTotalDrawdown(
  equity: any, // float balance
  paramDailyDrawdown: number, // Daily drawdown parameter (in numeric % e.g 5 = 5%)
  balance: number, // daily or initial balance
) {
  // Implement logic to calculate daily total drawdown
  const result = ((equity - balance) / balance) * 100;
  return result > paramDailyDrawdown ? result : 0;
}
