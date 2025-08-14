import { OpenPosition, ClosedPosition } from 'src/common/utils';
export function calculateLossPerTrade(
  openPositions: OpenPosition[],
  closedPositions: ClosedPosition[],
  paramLossPerTrade: number, // Loss per trade parameter (in numeric % e.g 5 = 5%)
  balance: number, // daily or initial balance
) {}
