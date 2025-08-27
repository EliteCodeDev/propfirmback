import { Account, RiskParams } from '../utils';
import {
  calculateProfitTarget,
  calculateDailyTotalDrawdown,
  calculateTradingDays,
  consecutiveInactiveDays,
} from './index';
import { riskEvaluationResult } from '../types/risk-results';
import { ClosedPosition } from '../utils/positions';

export function riskEvaluation(
  account: Account,
  riskParams: RiskParams,
): riskEvaluationResult {
  const { balance, openPositions, closedPositions } = account;
  const params = riskParams;
  const profitTarget = calculateProfitTarget(
    params.profitTarget,
    balance.currentBalance,
    balance.initialBalance,
  );
  const dailyDrawdown = calculateDailyTotalDrawdown(
    params.dailyDrawdown,
    balance.currentBalance,
    balance.dailyBalance,
  );
  const maxDrawdown = calculateDailyTotalDrawdown(
    params.maxDrawdown,
    balance.currentBalance,
    balance.initialBalance,
  );

  const tradingDays = calculateTradingDays(
    openPositions.positions,
    closedPositions.positions as ClosedPosition[],
  );
  
  // Asegurar que createDateTime sea un objeto Date válido
  let createDateTime: Date;
  try {
    if (account.createDateTime instanceof Date) {
      createDateTime = account.createDateTime;
    } else if (account.createDateTime) {
      // Intentar parsear si es string
      createDateTime = new Date(account.createDateTime);
      // Verificar si la fecha es válida
      if (isNaN(createDateTime.getTime())) {
        throw new Error('Invalid date');
      }
    } else {
      // Si no existe, usar fecha actual
      createDateTime = new Date();
    }
  } catch (error) {
    // En caso de error en el parseo, usar fecha actual
    createDateTime = new Date();
  }
    
  const inactiveDays = consecutiveInactiveDays(
    openPositions.positions,
    closedPositions.positions as ClosedPosition[],
    createDateTime,
    params.inactiveDays,
  );
  return {
    status:
      profitTarget.status &&
      dailyDrawdown.status &&
      maxDrawdown.status &&
      tradingDays.status &&
      inactiveDays.status,

    profitTarget,
    dailyDrawdown,
    maxDrawdown,
    tradingDays,
    inactiveDays,
  };
}
