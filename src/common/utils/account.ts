export class Account {
  userID: string;
  login: string;
  balance: number;
  equity: number;

  openPositions: Array<object>; // Assuming this is an object with position details

  closedPositions: Array<object>; // Assuming this is an object with closed position details
  lastUpdate: Date;

  // data posterior al analisis de las posiciones

  metaStats: Object;
  validation: Object;

}
