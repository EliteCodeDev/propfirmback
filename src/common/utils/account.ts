
import { OpenPosition,ResumenPositionOpen,ClosePosition,ResumePositionClose } from './positions'; 


export class Account {
  userID: string;
  login: string;
  balance: number;
  equity: number;

  openPositions: {
    open: OpenPosition[],
    ResumePositionOpen: ResumenPositionOpen
  }; // Assuming this is an object with position details

  closedPositions: {
    closed: ClosePosition[],
    ResumePositionClose: ResumePositionClose
  }; // Assuming this is an object with closed position details
  lastUpdate: Date;

  // data posterior al analisis de las posiciones

  metaStats: Object;
  validation: Object;
}
