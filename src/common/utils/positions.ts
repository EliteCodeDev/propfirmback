export class OpenPosition {
  symbol: string;
  time: string;
  type: string;
  volume: string;
  openPrice: string;
  sl: string;
  tp: string;
  swap: string;
  comment?: string;
  profit: string;
  // Campos específicos de MT5
  closePrice?: string;

  constructor() {}
}

export class ClosePosition {
  time: string;
  type: string;
  symbol: string;
  sl: string | number;
  tp: string | number;
  swap: string | number;
  closePrice: string | number;

  profit: number;
  // Campos específicos de MT5
  timeEnter?: string;
  ticket?: string;
  volume?: number;
  price?: number;
  timeExit?: string;
  commission?: number;
  rate?: number;

  commentary?: string;
  // Campos específicos de MT4
  order?: string;
  volume4?: string;
  openPrice?: string;

  constructor() {}
}

export class UserData {
  balance: string;
  user: string;
  server: string;
  login: string;
}

export class ResumenPositionOpen {
  balance: string;
  profit: string; // Profit (MT5) / Benefit (MT4)
  comment?: string; // Comment (MT5) / Comentary (MT4) / Commentary (MT4)

  // Campos específicos de MT5
  equity?: string; // Solo en MT5
  margin?: string; // Solo en MT5
  freeMargin?: string; // Solo en MT5
  level?: string; // Solo en MT5

  // Campos específicos de MT4
  commentary?: string; // Solo en MT4 (diferente a comment)
  equidad?: string; // Solo en MT4 (Equidad vs Equity)
  marginFree?: string; // Solo en MT4 (MarginFree vs FreeMargin)
  marginLevel?: string; // Solo en MT4
  totalProfit?: string; // Solo en MT4
}

export class ResumePositionClose {
  balance: string;
  totalBenefit: string;

  // Campos específicos de MT5
  credit?: string;
  recharge?: string;
  withdraw?: string;
  commission?: string;
  rate?: string;
  swap?: string;

  // Campos específicos de MT4
  benefitLose?: string;
  deposit?: string;
  withdrawal?: string;
}
