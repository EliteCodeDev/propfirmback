import { DataOpenPositions, DataClosePositions } from '../types/mt4/data.type';

export class Account {
  userID: string;
  login: string;
  balance: number;
  equity: number;

  openPositions: DataOpenPositions; // Assuming this is an object with position details

  closedPositions: DataClosePositions; // Assuming this is an object with closed position details
  lastUpdate: Date;

  // data posterior al analisis de las posiciones

  metaStats: Object;
  validation: Object;
}
