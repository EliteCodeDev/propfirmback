import {
  OpenPosition,
  ResumenPositionOpen,
  ClosedPosition,
  ResumePositionClose,
} from './positions';
import { MaxMinBalance, AverageMetrics, RiskParams } from './risk';
import { riskEvaluationResult } from '../types/risk-results';
import { ChallengeStatus } from 'src/common/enums';
import * as crypto from 'crypto';

export class PositionsClassType {
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
  accountID: string;
  login: string;
  challengeId?: string;

  balance?: Balance;

  equity?: number;

  openPositions?: PositionsClassType;

  closedPositions?: PositionsClassType;

  lastUpdate?: Date;

  createDateTime?: Date;

  metaStats?: MetaStats;

  riskValidation?: RiskParams;

  rulesEvaluation?: riskEvaluationResult;
  status: ChallengeStatus;

  //fue guardada en base de datos
  saved: boolean;
  updated: boolean;

  // Hash for dirty checking - tracks last persisted state
  private lastPersistedHash?: string;
  //
  constructor(accountID: string, login: string) {
    this.accountID = accountID;
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

  /**
   * Generates a hash of the account's persistable data
   * Used for dirty checking to determine if account needs to be saved
   */
  private generateDataHash(): string {
    const persistableData = {
      metaStats: this.metaStats,
      openPositions: this.openPositions?.positions,
      closedPositions: this.closedPositions?.positions,
      rulesEvaluation: this.rulesEvaluation,
      lastUpdate: this.lastUpdate,
      equity: this.equity,
      balance: this.balance,
    };

    const dataString = JSON.stringify(
      persistableData,
      Object.keys(persistableData).sort(),
    );
    return crypto.createHash('sha256').update(dataString).digest('hex');
  }

  /**
   * Checks if the account data has changed since last persistence
   * @returns true if account needs to be saved, false otherwise
   */
  isDirty(): boolean {
    if (!this.lastPersistedHash) {
      return true; // Never been persisted
    }

    const currentHash = this.generateDataHash();
    return currentHash !== this.lastPersistedHash;
  }

  /**
   * Marks the account as clean (just persisted)
   * Should be called after successful database save
   */
  markAsClean(): void {
    this.lastPersistedHash = this.generateDataHash();
    this.saved = true;
    this.updated = false;
  }

  /**
   * Marks the account as dirty (data changed)
   * Should be called when account data is modified
   */
  markAsDirty(): void {
    this.updated = true;
    this.saved = false;
  }

  /**
   * Gets the last persisted hash for debugging purposes
   */
  getLastPersistedHash(): string | undefined {
    return this.lastPersistedHash;
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
  equity: number;
  maxMinBalance: MaxMinBalance;
  averageMetrics: AverageMetrics;
  numTrades: number;
  
}
export class positionsDetails {
  openPositions: OpenPosition[];
  closedPositions: ClosedPosition[];
}

export class Balance {
  currentBalance: number;
  initialBalance: number;
  dailyBalance: number;
}
