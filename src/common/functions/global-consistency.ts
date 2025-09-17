import { ClosedPosition } from 'src/common/utils';
import { globalConsistencyResult } from 'src/common/types/risk-results';

// export function calculateGlobalConsistency(
//   closedPositions: ClosedPosition[],
//   initialBalance: number,
//   consistencyPercentage: number,
// ): globalConsistencyResult {
//   const violatingPositions: ClosedPosition[] = [];
//   let maxViolation = 0;

//   // iteración para determinar violaciones y máxima violación
//   for (const position of closedPositions) {
//     if (position.Profit < 0) {
//       const lossPercentage = Math.abs(position.Profit) / 100;

//       if (lossPercentage > consistencyPercentage) {
//         violatingPositions.push(position);
//         maxViolation = Math.max(maxViolation, lossPercentage);
//       }
//     }
//   }

//   const violatesConsistency = violatingPositions.length > 0;

//   return {
//     status: !violatesConsistency,
//     consistencyPercentage: maxViolation,
//     violatingPositions,
//   };
// }
export function calculateGlobalConsistency(
  equity: number,
  initialBalance: number,
  consistencyPercentage: number,
): globalConsistencyResult {
  const lossPercentage = Math.abs(equity - initialBalance) / 100;
  const violatesConsistency = lossPercentage > consistencyPercentage;
  return {
    status: !violatesConsistency,
    consistencyPercentage: lossPercentage,
  };
}
