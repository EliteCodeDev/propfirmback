import { Account, Balance, MetaStats, PositionsClassType } from '../account';
import { Challenge } from 'src/modules/challenges/entities/challenge.entity';
import { ChallengeDetails } from 'src/modules/challenges/entities/challenge-details.entity';
import { BrokerAccount } from 'src/modules/broker-accounts/entities/broker-account.entity';
import { RiskParams } from 'src/common/utils';
import { createAccountResponse } from 'src/modules/data/smt-api/client/smt-api.client';
import { CreateBrokerAccountDto } from 'src/modules/broker-accounts/dto/create-broker-account.dto';
import { ChallengeRelation } from 'src/modules/challenge-templates/entities/challenge-relation.entity';

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
export function getRiskParamsFromChallenge(
  challenge: Challenge,
  slugs: string[],
) {
  const riskParams = {};
  slugs.forEach((slug) => {
    riskParams[slug] = getParameterValueBySlug(challenge, slug);
  });
  return riskParams;
}
export function getBasicRiskParams(challenge: Challenge): RiskParams {
  return {
    profitTarget: getParameterValueBySlug(challenge, 'profit-target'),
    dailyDrawdown: getParameterValueBySlug(challenge, 'daily-drawdown'),
    maxDrawdown: getParameterValueBySlug(challenge, 'max-drawdown'),
    tradingDays: getParameterValueBySlug(challenge, 'trading-days'),
    lossPerTrade: getParameterValueBySlug(challenge, 'loss-per-trade'),
    inactiveDays: getParameterValueBySlug(challenge, 'inactive-days'),
  };
}

/**
 * Obtiene el leverage desde las reglas de fase del challenge
 * @param challenge - El challenge que contiene la relación con los parámetros
 * @returns El valor de leverage o 100 como valor por defecto
 */
export function getLeverageFromChallenge(challenge: Challenge): number {
  const leverage = getParameterValueBySlug(challenge, 'leverage');
  return leverage > 0 ? leverage : 100; // Valor por defecto si no se encuentra
}

/**
 * Obtiene el leverage desde las reglas de fase de una relación de challenge
 * @param relation - La relación que contiene los parámetros de las fases
 * @param phaseIndex - Índice de la fase (por defecto 0 para la primera fase)
 * @returns El valor de leverage o 100 como valor por defecto
 */
export function getLeverageFromRelation(relation: ChallengeRelation, phaseIndex: number = 0): number {
  if (!relation?.stages || relation.stages.length === 0) {
    return 100; // Valor por defecto
  }

  const stage = relation.stages[phaseIndex];
  if (!stage?.parameters) {
    return 100; // Valor por defecto
  }

  const parameter = stage.parameters.find(
    (param) => param.rule?.ruleSlug === 'leverage',
  );

  const leverage = Number(parameter?.ruleValue || 0);
  return leverage > 0 ? leverage : 100; // Valor por defecto si no se encuentra
}

/**
 * Calcula los parámetros de reglas considerando modificaciones por addons
 * Esta función ahora actúa como un wrapper que delega al AddonRulesService
 * @param challenge - El challenge con addons cargados
 * @param baseRiskParams - Parámetros base extraídos de las reglas de fase
 * @param addonRulesService - Servicio para aplicar modificaciones de addons
 * @returns RiskParams modificados por addons
 */
export async function calculateRiskParamsWithAddons(
  challenge: Challenge,
  baseRiskParams: RiskParams,
  addonRulesService?: any, // AddonRulesService - usando any para evitar dependencia circular
): Promise<RiskParams> {
  if (!challenge.addons || challenge.addons.length === 0) {
    return baseRiskParams;
  }

  // Si se proporciona el servicio, usarlo para calcular las modificaciones
  if (addonRulesService) {
    return await addonRulesService.calculateRiskParamsWithAddons(challenge, baseRiskParams);
  }

  // Fallback: lógica básica sin servicio (para compatibilidad)
  const modifiedParams = { ...baseRiskParams };
  
  challenge.addons
    .filter(addon => addon.isActive && addon.addon)
    .forEach(challengeAddon => {
      const addonName = challengeAddon.addon.name.toLowerCase();
      
      // Lógica básica de modificación
      if (addonName.includes('news trading')) {
        // News trading addon - lógica básica
      }
    });

  return modifiedParams;
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
  account.challengeId = challenge.challengeID;
  account.status = challenge.status;
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
    account.riskValidation = new RiskParams();
  }
  const rulesParams = challenge.details?.rulesParams;
  if (rulesParams) {
    account.riskValidation = {
      ...rulesParams,
    };
  } else {
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
  }
  // Asignar valores usando la función helper reutilizable
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
  account.riskValidation = new RiskParams();
  account.riskValidation.profitTarget = 0;
  account.riskValidation.dailyDrawdown = 0;
  account.riskValidation.maxDrawdown = 0;
  account.riskValidation.tradingDays = 0;
  account.riskValidation.inactiveDays = 0;

  return account;
}

/**
 * Mapea challenges a accounts con datos básicos únicamente
 * Excluye: posiciones, ruleEvaluation, riskValidation, rulesEvaluation
 * @param challenges Array de challenges
 * @returns Array de accounts con datos básicos
 */
export function mapChallengesToBasicAccounts(
  challenges: Challenge[],
): Partial<Account>[] {
  return challenges
    .filter((challenge) => challenge.brokerAccount)
    .map((challenge) => {
      try {
        const basicAccount = {
          accountID: challenge.challengeID,
          login: challenge.brokerAccount.login,
          createDateTime: challenge.startDate
            ? new Date(challenge.startDate)
            : new Date(),
          lastUpdate: new Date(),
          status: challenge.status,
          balance: {
            initialBalance:
              // challenge.brokerAccount.innitialBalance ||
              0,
            currentBalance:
              // challenge.dynamicBalance ||
              // challenge.brokerAccount.innitialBalance ||
              10,
            dailyBalance:
              challenge.dynamicBalance ||
              challenge.brokerAccount.innitialBalance ||
              0,
          },
          equity:
            challenge.details?.metaStats?.equity ||
            challenge.dynamicBalance ||
            0,
          metaStats: challenge.details?.metaStats
            ? {
                equity: challenge.details.metaStats.equity || 0,
                maxMinBalance: challenge.details.metaStats.maxMinBalance || {
                  maxBalance: 0,
                  minBalance: 0,
                },
                averageMetrics: challenge.details.metaStats.averageMetrics || {
                  averageProfit: 0,
                  losingTrades: 0,
                  winningTrades: 0,
                  totalTrades: 0,
                  lossRate: 0,
                  averageLoss: 0,
                  winRate: 0,
                },
                numTrades: challenge.details.metaStats.numTrades || 0,
              }
            : undefined,
          brokerAccount: challenge.brokerAccount,
        };
        return basicAccount;
      } catch (error) {
        console.error(
          `Error mapeando challenge ${challenge.challengeID}:`,
          error,
        );
        return null;
      }
    })
    .filter((account) => account !== null);
}
export function createSmtApiResponseToBrokerAccount(
  response: createAccountResponse['userDataAccount'],
): CreateBrokerAccountDto {
  return {
    login: response.login,
    password: response.password,
    investorPass: response.passwordInversor,
    server: response.servidor,
    innitialBalance: parseInt(response.deposito),
    isUsed: true,
  };
}
