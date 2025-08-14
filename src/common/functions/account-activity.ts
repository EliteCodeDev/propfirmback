import { ClosedPosition, OpenPosition } from 'src/common/utils';

export function calculateTradingDays(
  openPositions: OpenPosition[],
  closedPositions: ClosedPosition[],
  accountCreateDatetime: Date,
) {
  //
  const positionsByDays = groupPositionsByDays(openPositions, closedPositions);
  return {
    numDays: Object.keys(positionsByDays).length,
    positionsPerDay: positionsByDays,
  };
}
export function consecutiveInactiveDays(
  openPositions: OpenPosition[],
  closedPositions: ClosedPosition[],
  accountCreateDatetime: Date,
) {
  const positionsByDays = groupPositionsByDays(openPositions, closedPositions);
  const today = new Date();
  const daysSinceCreation = Math.floor(
    (today.getTime() - accountCreateDatetime.getTime()) / (1000 * 60 * 60 * 24),
  );
  let consecutiveInactive = 0;
  for (let i = 0; i <= daysSinceCreation; i++) {
    const date = new Date(
      accountCreateDatetime.getTime() + i * 24 * 60 * 60 * 1000,
    )
      .toISOString()
      .split('T')[0];
    if (positionsByDays[date]) {
      consecutiveInactive = 0; // reset if there was activity
    } else {
      consecutiveInactive++;
    }
  }
  return consecutiveInactive;
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
  const grouped = allPositions.reduce(
    (acc, position) => {
      const date = new Date(position.timeEnter).toISOString().split('T')[0];
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
