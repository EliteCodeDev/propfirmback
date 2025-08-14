import {
  OpenPosition,
  ResumenPositionOpen,
  ClosedPosition,
  ResumePositionClose,
} from './positions';
import { MaxMinBalance, AverageMetrics } from './risk';
import { riskEvaluationResult } from '../types/risk-results';

export type AccountStatus = 'active' | 'completed' | 'failed' | 'pending';

export class Account {
  userID: string;
  login: string;

  balance: Balance;

  // dailyBalanceHistory: number[];

  status: AccountStatus;
  openPositions: {
    open: OpenPosition[];
    ResumePositionOpen: ResumenPositionOpen;
    numPositions: number;
  }; // Assuming this is an object with position details

  closedPositions: {
    closed: ClosedPosition[];
    ResumePositionClose: ResumePositionClose;
    numPositions: number;
  }; // Assuming this is an object with closed position details
  lastUpdate: Date;

  createDateTime: Date;

  // data posterior al analisis de las posiciones

  metaStats: MetaStats;
  riskValidation: riskEvaluationResult;
}
export class LoginAccount {
  login: string;
  password: string;
  id: string;
  ip: string;
  platform: string;
}
export class MetaStats {
  equity: number;
  maxMinBalance: MaxMinBalance;
  averageMetrics: AverageMetrics;
  numTrades: number;
}
export class RiskValidation {
  profitTarget: number;
  dailyTotalDrawdown: number;
  tradingDays: number;
  inactiveDays: number;
}
export class Balance {
  currentBalance: number;
  initialBalance: number;
  dailyBalance: number;
}
