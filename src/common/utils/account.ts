import {
  OpenPosition,
  ResumenPositionOpen,
  ClosedPosition,
  ResumePositionClose,
} from './positions';
import { MaxMinBalance, AverageMetrics } from './risk';

export class Account {
  userID: string;
  login: string;
  balance: number; //current balance
  equity: number;

  openPositions: {
    open: OpenPosition[];
    ResumePositionOpen: ResumenPositionOpen;
  }; // Assuming this is an object with position details

  closedPositions: {
    closed: ClosedPosition[];
    ResumePositionClose: ResumePositionClose;
  }; // Assuming this is an object with closed position details
  lastUpdate: Date;

  // data posterior al analisis de las posiciones

  metaStats: Object;
  riskValidation: Object;
}
export class LoginAccount {
  login: string;
  password: string;
  id: string;
  ip: string;
  platform: string;
}
export class metaStats {
  maxMinBalance: MaxMinBalance;
  averageMetrics: AverageMetrics;
  lastUpdate: Date;
  numTrades: number;
}
export class riskValidation {
  profitTarget: number;
  dailyTotalDrawdown: number;
  tradingDays: number;
  inactiveDays: number;
}
