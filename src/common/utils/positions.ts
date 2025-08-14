export class OpenPosition {
  OrderId: string;
  Symbol: string;
  TimeOpen: string;
  Type: string;
  Volume: number;
  OpenPrice: number;
  SL: number;
  TP: number;
  ClosePrice: number;
  Swap: number;
  Profit: number;
  Commentary: string;

  constructor() { }
}

export class ClosedPosition {
  OrderId: string;
  TimeOpen: string;
  Type: string;
  Volume: number;
  Symbol: string;
  OpenPrice: number;
  SL: number;
  TP: number;
  TimeClose: string;
  ClosePrice: number;
  Commission: number;
  Rate: number;
  Swap: number;
  Profit: number;
  Commentary: string;

  constructor() { }
}

export class UserData {
  balance: string;
  user: string;
  server: string;
  login: string;

  constructor() { }
}

export class ResumenPositionOpen {
  Balance: number;
  Commentary: string;
  Equity: number;
  Margin: number;
  FreeMargin: number;
  Level: number;
  Profit: number;

  constructor(){

  }
}

export class ResumePositionClose {
  Profit_Lose: number;
  Credit: number;
  Deposit: number;
  Withdrawal: number;
  Profit: number;
  Swap: number;
  Rate: number;
  Commission: number;
  Balance: number;

  constructor(){

  }
}

