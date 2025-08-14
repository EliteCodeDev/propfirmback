export function calculateProfitTarget(
  paramProfitTarget: number, // Profit target parameter (in numeric % e.g 5 = 5%)
  currentBalance: number, // daily or initial balance
  initialBalance: number,
) {
  const profit = ((currentBalance - initialBalance) / initialBalance) * 100;
  return profit > paramProfitTarget ? profit : 0;
}
