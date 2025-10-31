import { Account, RiskParams } from '../utils';
import {
  calculateProfitTarget,
  calculateDailyTotalDrawdown,
  calculateTradingDays,
  consecutiveInactiveDays,
} from './index';
import { riskEvaluationResult } from '../types/risk-results';
import { ClosedPosition } from '../utils/positions';
import { calculateGlobalConsistency } from './global-consistency';

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
  // Daily drawdown: validar contra ambas métricas (currentBalance y equity)
  // Si no existe dailyBalance (baseline del día), no evaluar y marcar como cumplida
  let dailyDrawdown;
  if (balance.dailyBalance == null || balance.dailyBalance <= 0) {
    dailyDrawdown = {
      status: true,
      drawdown: 0,
    };
  } else {
    const dailyDDByBalance = calculateDailyTotalDrawdown(
      params.dailyDrawdown,
      balance.currentBalance,
      balance.dailyBalance,
    );
    const dailyDDByEquity = calculateDailyTotalDrawdown(
      params.dailyDrawdown,
      account.equity ?? balance.currentBalance,
      balance.dailyBalance,
    );
    dailyDrawdown = {
      status: dailyDDByBalance.status && dailyDDByEquity.status,
      drawdown: Math.max(dailyDDByBalance.drawdown, dailyDDByEquity.drawdown),
    };
  }

  // Max drawdown condicional según regla de equity en tiempo real:
  // - Si equity < balance inicial => comparar equity contra balance inicial
  // - Caso contrario => comparar equity contra balance actual (saldo asentado)
  const eqVal = account.equity ?? balance.currentBalance;
  const initVal = balance.initialBalance;
  const currVal = balance.currentBalance;
  let maxDrawdown;
  if (eqVal != null && initVal != null && initVal > 0 && eqVal < initVal) {
    maxDrawdown = calculateDailyTotalDrawdown(
      params.maxDrawdown,
      eqVal,
      initVal,
    );
  } else if (eqVal != null && currVal != null && currVal > 0) {
    maxDrawdown = calculateDailyTotalDrawdown(
      params.maxDrawdown,
      eqVal,
      currVal,
    );
  } else {
    // Fallback seguro: comparar balance actual vs balance inicial
    maxDrawdown = calculateDailyTotalDrawdown(
      params.maxDrawdown,
      currVal,
      initVal,
    );
  }

  const tradingDays = calculateTradingDays(
    openPositions.positions,
    closedPositions.positions as ClosedPosition[],
  );
  // const globalConsistency = calculateGlobalConsistency(
  //   closedPositions.positions as ClosedPosition[],
  //   balance.initialBalance,
  //   1,
  // );
  const globalConsistency = calculateGlobalConsistency(
    account.equity || balance.currentBalance,
    balance.initialBalance,
    1,
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
      globalConsistency.status &&
      inactiveDays.status,

    profitTarget,
    dailyDrawdown,
    maxDrawdown,
    tradingDays,
    inactiveDays,
    globalConsistency,
  };
}
