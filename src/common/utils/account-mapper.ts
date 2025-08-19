import {
  Account,
  Balance,
  MetaStats,
  RiskValidation,
  PositionsClassType,
} from './account';
import { Challenge } from 'src/modules/challenges/entities/challenge.entity';
import { ChallengeDetails } from 'src/modules/challenges/entities/challenge-details.entity';
import { BrokerAccount } from 'src/modules/broker-accounts/entities/broker-account.entity';

/**
 * Función utilitaria para obtener valores de parámetros por slug desde un challenge
 * @param challenge - El challenge que contiene la relación con los parámetros
 * @param slug - El slug del parámetro a buscar
 * @returns El valor numérico del parámetro o 0 si no se encuentra
 */
export function getParameterValueBySlug(
  challenge: Challenge,
  slug: string,
): number {
  if (!challenge.relation?.stages || challenge.relation.stages.length === 0) {
    console.log('no hay data para:' + challenge.relationID);
    console.log('challenge ' + JSON.stringify(challenge));
    console.log(JSON.stringify(challenge.relation?.stages));
    return 0;
  }

  const stageIndex = (challenge.numPhase || 1) - 1;
  const stage = challenge.relation.stages[stageIndex];

  if (!stage?.parameters) {
    return 0;
  }

  const parameter = stage.parameters.find(
    (param) => param.rule?.ruleSlug === slug,
  );

  return Number(parameter?.ruleValue || 0);
}

/**
 * Mapea los datos de Challenge, ChallengeDetails y BrokerAccount a la estructura Account del buffer
 * @param challenge Entidad Challenge con relaciones cargadas
 * @returns Account configurada para el buffer
 */
export function mapChallengeToAccount(challenge: Challenge): Account {
  if (!challenge.brokerAccount) {
    throw new Error(
      `Challenge ${challenge.challengeID} no tiene BrokerAccount asociado`,
    );
  }

  // Crear la cuenta base
  const account = new Account(
    challenge.brokerAccount.brokerAccountID,
    challenge.brokerAccount.login,
  );

  // Configurar fechas - asegurar que sean objetos Date válidos
  account.createDateTime = challenge.startDate
    ? new Date(challenge.startDate)
    : new Date();
  account.lastUpdate = new Date();

  // Configurar balance inicial desde BrokerAccount
  account.balance = new Balance();
  account.balance.initialBalance = challenge.brokerAccount.innitialBalance || 0;
  account.balance.currentBalance =
    challenge.dynamicBalance || challenge.brokerAccount.innitialBalance || 0;
  account.balance.dailyBalance = challenge.dynamicBalance;

  // Configurar equity inicial
  account.equity = challenge.details?.metaStats?.equity || 0;
  // Inicializar posiciones vacías
  account.openPositions = new PositionsClassType();
  account.openPositions.setPositions([]);
  account.openPositions.setLenght(0);

  account.closedPositions = new PositionsClassType();
  account.closedPositions.setPositions([]);
  account.closedPositions.setLenght(0);

  // Procesar ChallengeDetails si existen
  if (challenge.details) {
    mapChallengeDetailsToAccount(account, challenge.details);
  }

  // Inicializar riskValidation si no existe
  if (!account.riskValidation) {
    account.riskValidation = new RiskValidation();
  }

  // Asignar valores usando la función helper reutilizable
  account.riskValidation.profitTarget = getParameterValueBySlug(
    challenge,
    'profit-target',
  );
  account.riskValidation.dailyDrawdown = getParameterValueBySlug(
    challenge,
    'daily-drawdown',
  );
  account.riskValidation.maxDrawdown = getParameterValueBySlug(
    challenge,
    'max-drawdown',
  );
  account.riskValidation.tradingDays = getParameterValueBySlug(
    challenge,
    'trading-days',
  );
  account.riskValidation.inactiveDays = getParameterValueBySlug(
    challenge,
    'inactive-days',
  );

  return account;
}

/**
 * Mapea los datos de ChallengeDetails a una cuenta existente
 * @param account Cuenta a actualizar
 * @param details ChallengeDetails con datos serializados
 */
export function mapChallengeDetailsToAccount(
  account: Account,
  details: ChallengeDetails,
): void {
  try {
    // Procesar metaStats si existe
    if (details.metaStats) {
      const metaStatsData = details.metaStats;
      account.metaStats = new MetaStats();
      account.metaStats.equity = metaStatsData.equity || account.equity || 0;
      account.metaStats.maxMinBalance = metaStatsData.maxMinBalance || {
        maxBalance: 0,
        minBalance: 0,
      };
      account.metaStats.averageMetrics = metaStatsData.averageMetrics || {
        averageProfit: 0,
        losingTrades: 0,
        winningTrades: 0,
        totalTrades: 0,
        lossRate: 0,
        averageLoss: 0,
        winRate: 0,
      };
      account.metaStats.numTrades = metaStatsData.numTrades || 0;

      // Actualizar equity de la cuenta
      if (metaStatsData.equity) {
        account.equity = metaStatsData.equity;
      }
    }

    // Procesar positions si existe
    if (details.positions) {
      const positionsData = details.positions;

      // Procesar posiciones abiertas
      if (
        positionsData.openPositions &&
        Array.isArray(positionsData.openPositions)
      ) {
        account.openPositions.setPositions(positionsData.openPositions);
        account.openPositions.setLenght(positionsData.openPositions.length);
      }

      // Procesar posiciones cerradas
      if (
        positionsData.closedPositions &&
        Array.isArray(positionsData.closedPositions)
      ) {
        account.closedPositions.setPositions(positionsData.closedPositions);
        account.closedPositions.setLenght(positionsData.closedPositions.length);
      }
    }

    // Procesar rulesValidation si existe
    if (details.rulesValidation) {
      const rulesData = details.rulesValidation;

      // Si ya existe rulesEvaluation, mantenerla; si no, inicializar desde rulesValidation
      if (!account.rulesEvaluation && rulesData) {
        account.rulesEvaluation = rulesData;
      }
    }

    // Actualizar timestamp - asegurar que sea un objeto Date válido
    account.lastUpdate = details.lastUpdate
      ? new Date(details.lastUpdate)
      : new Date();
  } catch (error) {
    console.error('Error procesando ChallengeDetails:', error);
    // En caso de error, mantener la cuenta con valores por defecto
  }
}

/**
 * Convierte múltiples challenges a cuentas para el buffer
 * @param challenges Array de challenges con relaciones cargadas
 * @returns Array de cuentas mapeadas
 */
export function mapChallengesToAccounts(challenges: Challenge[]): Account[] {
  return challenges
    .filter((challenge) => challenge.brokerAccount) // Solo challenges con broker account
    .map((challenge) => {
      try {
        return mapChallengeToAccount(challenge);
      } catch (error) {
        console.error(
          `Error mapeando challenge ${challenge.challengeID}:`,
          error,
        );
        return null;
      }
    })
    .filter((account) => account !== null) as Account[];
}

/**
 * Crea una cuenta básica desde un Challenge sin ChallengeDetails
 * @param challenge Challenge con BrokerAccount
 * @returns Account básica para el buffer
 */
export function createBasicAccountFromChallenge(challenge: Challenge): Account {
  if (!challenge.brokerAccount) {
    throw new Error(
      `Challenge ${challenge.challengeID} no tiene BrokerAccount asociado`,
    );
  }

  const account = new Account(challenge.userID, challenge.brokerAccount.login);

  // Configurar datos básicos - asegurar que sean objetos Date válidos
  account.createDateTime = challenge.startDate
    ? new Date(challenge.startDate)
    : new Date();
  account.lastUpdate = new Date();

  // Balance inicial
  account.balance = new Balance();
  account.balance.initialBalance = challenge.brokerAccount.innitialBalance || 0;
  account.balance.currentBalance =
    challenge.dynamicBalance || challenge.brokerAccount.innitialBalance || 0;
  account.balance.dailyBalance = account.balance.currentBalance;

  account.equity = account.balance.currentBalance;

  // Posiciones vacías
  account.openPositions = new PositionsClassType();
  account.openPositions.setPositions([]);
  account.openPositions.setLenght(0);

  account.closedPositions = new PositionsClassType();
  account.closedPositions.setPositions([]);
  account.closedPositions.setLenght(0);

  // Validaciones vacías
  account.riskValidation = new RiskValidation();
  account.riskValidation.profitTarget = 0;
  account.riskValidation.dailyDrawdown = 0;
  account.riskValidation.tradingDays = 0;
  account.riskValidation.inactiveDays = 0;

  return account;
}
