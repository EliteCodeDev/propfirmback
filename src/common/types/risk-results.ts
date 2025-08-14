import { ClosedPosition, OpenPosition } from 'src/common/utils';

export interface profitTargetResult {
  status: boolean;
  profit: number;
  profitTarget: number;
}
export interface dailyTotalDrawdownResult {
  status: boolean;
  drawdown: number;
}

export interface tradingDaysResult {
  status: boolean;
  numDays: number;
  positionsPerDay: Record<string, (OpenPosition | ClosedPosition)[]>;
}
export interface consecutiveInactiveDaysResult {
  startDate: string | null;
  endDate: string | null;
  inactiveDays: number;
  status: boolean;
}
export interface riskEvaluationResult {
  status: boolean;
  profitTarget: profitTargetResult;
  dailyDrawdown: dailyTotalDrawdownResult;
  maxDrawdown: dailyTotalDrawdownResult;
  tradingDays: tradingDaysResult;
  inactiveDays: consecutiveInactiveDaysResult;
}
