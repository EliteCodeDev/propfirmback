import { ClosedPosition, OpenPosition } from 'src/common/utils';
import {
  tradingDaysResult,
  consecutiveInactiveDaysResult,
} from '../types/risk-results';
export function calculateTradingDays(
  openPositions: OpenPosition[],
  closedPositions: ClosedPosition[],
): tradingDaysResult {
  //
  const positionsByDays = groupPositionsByDays(openPositions, closedPositions);
  return {
    status: true,
    numDays: Object.keys(positionsByDays).length,
    positionsPerDay: positionsByDays,
  };
}
export function consecutiveInactiveDays(
  openPositions: OpenPosition[],
  closedPositions: ClosedPosition[],
  accountCreateDatetime: Date,
  paramInactiveDays: number,
): consecutiveInactiveDaysResult {
  // Validar que accountCreateDatetime sea una fecha válida
  let validCreateDate: Date;
  try {
    if (!accountCreateDatetime || isNaN(accountCreateDatetime.getTime())) {
      // Si la fecha no es válida, usar fecha actual menos 1 día
      validCreateDate = new Date();
      validCreateDate.setDate(validCreateDate.getDate() - 1);
    } else {
      validCreateDate = accountCreateDatetime;
    }
  } catch (error) {
    // En caso de error, usar fecha actual menos 1 día
    validCreateDate = new Date();
    validCreateDate.setDate(validCreateDate.getDate() - 1);
  }

  const positionsByDays = groupPositionsByDays(openPositions, closedPositions);
  const today = new Date();
  const daysSinceCreation = Math.floor(
    (today.getTime() - validCreateDate.getTime()) / (1000 * 60 * 60 * 24),
  );

  let consecutiveInactive = 0;
  let maxConsecutiveInactive = 0;
  let currentInactiveStart: string | null = null;
  let longestInactiveStart: string | null = null;
  let longestInactiveEnd: string | null = null;

  for (let i = 0; i <= daysSinceCreation; i++) {
    const currentDate = new Date(
      validCreateDate.getTime() + i * 24 * 60 * 60 * 1000,
    );
    const dateString = currentDate.toISOString().split('T')[0];

    if (positionsByDays[dateString]) {
      // Hay actividad en este día
      if (consecutiveInactive > maxConsecutiveInactive) {
        maxConsecutiveInactive = consecutiveInactive;
        longestInactiveStart = currentInactiveStart;
        longestInactiveEnd = new Date(
          currentDate.getTime() - 24 * 60 * 60 * 1000,
        )
          .toISOString()
          .split('T')[0];
      }
      consecutiveInactive = 0;
      currentInactiveStart = null;
    } else {
      // No hay actividad en este día
      if (consecutiveInactive === 0) {
        currentInactiveStart = dateString;
      }
      consecutiveInactive++;
    }
  }

  // Verificar la racha final si termina en inactividad
  if (consecutiveInactive > maxConsecutiveInactive) {
    maxConsecutiveInactive = consecutiveInactive;
    longestInactiveStart = currentInactiveStart;
    longestInactiveEnd = today.toISOString().split('T')[0];
  }

  const status = maxConsecutiveInactive <= paramInactiveDays;

  return {
    startDate: longestInactiveStart,
    endDate: longestInactiveEnd,
    inactiveDays: maxConsecutiveInactive,
    status,
  };
}
export function mergePositions(
  openPositions: OpenPosition[],
  closedPositions: ClosedPosition[],
) {
  const mergedPositions = [...openPositions, ...closedPositions];
  return mergedPositions;
}
export function groupPositionsByDays(
  openPositions: OpenPosition[],
  closedPositions: ClosedPosition[],
) {
  const allPositions = mergePositions(openPositions, closedPositions);

  // Helper: intenta obtener una fecha válida para la posición.
  // Usa TimeOpen; si no existe y es posición cerrada, intenta con TimeClose.
  const getValidDate = (position: OpenPosition | ClosedPosition): Date | null => {
    const raw = position.TimeOpen || (position as ClosedPosition).TimeClose;
    if (!raw) return null;
    const d = new Date(raw);
    return isNaN(d.getTime()) ? null : d;
  };

  const grouped = allPositions.reduce(
    (acc, position) => {
      const dateObj = getValidDate(position);
      if (!dateObj) {
        // Omitir posiciones sin fecha válida sin generar errores en consola
        return acc;
      }
      const date = dateObj.toISOString().split('T')[0];
      if (!acc[date]) {
        acc[date] = [];
      }
      acc[date].push(position);
      return acc;
    },
    {} as Record<string, (OpenPosition | ClosedPosition)[]>,
  );
  return grouped;
}
