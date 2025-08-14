import {
  OpenPosition,
  ResumenPositionOpen,
  ClosedPosition,
  ResumePositionClose,
} from './positions';
import { MaxMinBalance, AverageMetrics } from './risk';


class PositionsClassType {
  positions: OpenPosition[] | ClosedPosition[];
  resume: ResumePositionClose | ResumenPositionOpen;
  lenght: number;

  setPositions(data: any[]) {
    this.positions = data;
  }

  setResume(data: any) {
    this.resume = data;
  }

  getPositions() {
    return this.positions;
  }

  getResume() {
    return this.resume;
  }

  getLenght() {
    return this.lenght;
  }

  setLenght(lenght: number) {
    this.lenght = lenght;
  }
}

export class Account {
  userID: string;
  login: string;

  balance?: Balance;

  equity?: number;

  openPositions?: PositionsClassType 

  closedPositions?: PositionsClassType

  lastUpdate?: Date;

  createDateTime?: Date;

  metaStats?: MetaStats;

  riskValidation?: RiskValidation;

  constructor(userID: string, login: string) {
    this.userID = userID;
    this.login = login;
  }

  setOpenPositions(data: OpenPosition[]) {
    this.openPositions.setPositions(data);
  }

  setClosedPositions(data: ClosedPosition[]) {
    this.closedPositions.setPositions(data);
  }

  getOpenPositions() {
    return this.openPositions.getPositions();
  }

  getClosedPositions() {
    return this.closedPositions.getPositions();
  }

  getOpenPositionsLenght() {
    return this.openPositions.getLenght();
  }

  getClosedPositionsLenght() {
    return this.closedPositions.getLenght();
  }

  setOpenResume(data: ResumenPositionOpen) {
    this.openPositions.setResume(data);
  }

  setClosedResume(data: ResumePositionClose) {
    this.closedPositions.setResume(data);
  }

  getOpenResume() {
    return this.openPositions.getResume();
  }

  getClosedResume() {
    return this.closedPositions.getResume();
  }
}

export class LoginAccount {
  login: string;
  password: string;
  id: string;
  ip: string;
  platform: string;
}

export class MetaStats {
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
