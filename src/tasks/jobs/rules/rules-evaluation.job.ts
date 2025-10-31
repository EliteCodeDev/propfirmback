import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { BufferService } from 'src/lib/buffer/buffer.service';
import { Account, RiskParams } from 'src/common/utils';
import * as riskFunctions from 'src/common/functions';
import { riskEvaluationResult } from 'src/common/types/risk-results';
import { ChallengeStatus } from 'src/common/enums';
import { CustomLoggerService } from 'src/common/services/custom-logger.service';
import { ChallengesService } from 'src/modules/challenges/services/challenges.service';
@Injectable()
export class RulesEvaluationJob {
  private readonly logger = new Logger(RulesEvaluationJob.name);
  constructor(
    private readonly bufferService: BufferService,
    private readonly customLogger: CustomLoggerService,
    private readonly challengesService: ChallengesService,
  ) {}

  @Cron('20,50 */3 * * * *')
  async evaluate() {
    const startTime = Date.now();

    this.customLogger.logJob({
      jobName: 'RulesEvaluationJob',
      operation: 'evaluate_rules',
      status: 'started',
      details: { trigger: 'scheduled' },
    });

    try {
      const stats = this.bufferService.getStats();
      if (stats.bufferSize === 0) {
        this.logger.debug('Buffer vacío, saltando evaluación de reglas');

        this.customLogger.logJob({
          jobName: 'RulesEvaluationJob',
          operation: 'evaluate_rules_empty',
          status: 'completed',
          details: {
            trigger: 'scheduled',
            buffer_size: 0,
            duration_ms: Date.now() - startTime,
          },
        });
        return;
      }

      this.logger.debug(
        `Iniciando evaluación de reglas para ${stats.bufferSize} cuentas`,
      );

      this.customLogger.logJob({
        jobName: 'RulesEvaluationJob',
        operation: 'evaluate_rules_processing',
        status: 'in_progress',
        details: { buffer_size: stats.bufferSize },
      });

      // Obtener todas las entradas del buffer
      const entries = await this.bufferService.listEntries();
      let processedCount = 0;
      let validationCount = 0;
      let skippedCount = 0;

      // Procesar cada cuenta individualmente usando upsertAccount
      for (const [login, account] of entries) {
        try {
          // Recrear instancia de Account para restaurar métodos de clase
          const accountInstance = this.recreateAccountInstance(account);

          // Evaluar SIEMPRE las reglas de riesgo, incluso si la cuenta no está marcada como "dirty".
          // Esto garantiza que las violaciones críticas existentes disparen la desaprobación
          // aunque no haya cambios recientes en el buffer.

          // Evaluar reglas de riesgo solo si hay cambios
          const riskEvaluation = await this.evaluateAccountRules(
            accountInstance,
            accountInstance.riskValidation,
            // this.getDefaultRiskParams(), // Usar parámetros por defecto o desde configuración
          );

          // lógica de cambio de estado

          const challengeStatus = await this.evaluateRiskStatus(
            riskEvaluation,
            accountInstance.status,
          );
          accountInstance.status = challengeStatus;

          // Si la cuenta es desaprobable, ejecutar proceso de desaprobación
          if (challengeStatus === ChallengeStatus.DISAPPROVABLE) {
            await this.handleDisapproval(accountInstance, riskEvaluation);
          }

          // Actualizar la cuenta con los resultados de validación
          await this.bufferService.upsertAccount(login, (prev) => {
            // Crear una nueva instancia de Account manteniendo todos los métodos
            const updated = Object.assign(
              Object.create(Object.getPrototypeOf(prev)),
              prev,
            );
            // Actualizar rulesEvaluation con el resultado completo de la evaluación
            updated.rulesEvaluation = riskEvaluation;
            // No sobrescribir riskValidation (parámetros del challenge). Mantener los originales.
            updated.lastUpdate = new Date();
            return updated;
          });

          processedCount++;
          if (riskEvaluation.status) {
            validationCount++;
          }
        } catch (error) {
          this.logger.error(`Error procesando cuenta ${login}:`, error);
        }
      }

      this.logger.debug(
        `RulesEvaluationJob completado: procesadas=${processedCount}/${stats.bufferSize}, saltadas=${skippedCount}, validaciones_exitosas=${validationCount}`,
      );

      const duration = Date.now() - startTime;

      this.customLogger.logJob({
        jobName: 'RulesEvaluationJob',
        operation: 'evaluate_rules_success',
        status: 'completed',
        details: {
          trigger: 'scheduled',
          duration_ms: duration,
          total_accounts: stats.bufferSize,
          processed_count: processedCount,
          skipped_count: skippedCount,
          validation_count: validationCount,
        },
      });
    } catch (error) {
      const duration = Date.now() - startTime;

      this.logger.error(`Error en RulesEvaluationJob:`, error);

      this.customLogger.logJob({
        jobName: 'RulesEvaluationJob',
        operation: 'evaluate_rules_error',
        status: 'failed',
        details: {
          trigger: 'scheduled',
          duration_ms: duration,
          error: error?.message || error.toString(),
        },
      });
    }
  }

  /**
   * Evalúa las reglas de riesgo para una cuenta específica
   * @param account Cuenta a evaluar
   * @param riskParams Parámetros de riesgo
   * @returns Resultado de la evaluación
   */
  private async evaluateAccountRules(
    account: Account,
    riskParams: RiskParams,
  ): Promise<riskEvaluationResult> {
    try {
      const riskEvaluation = riskFunctions.riskEvaluation(account, riskParams);

      // this.logger.debug(
      //   `Resultado de evaluación para cuenta ${account.login}:`,
      //   riskEvaluation,
      // );
      return riskEvaluation;
    } catch (error) {
      this.logger.error(
        `Error evaluando reglas para cuenta ${account.login}:`,
        error,
      );
      return {
        status: false,
        profitTarget: { status: false, profit: 0, profitTarget: 0 },
        dailyDrawdown: { status: false, drawdown: 0 },
        maxDrawdown: { status: false, drawdown: 0 },
        tradingDays: { status: false, numDays: 0, positionsPerDay: {} },
        inactiveDays: {
          startDate: null,
          endDate: null,
          inactiveDays: 0,
          status: false,
        },
      } as riskEvaluationResult;
    }
  }

  private async evaluateRiskStatus(
    riskEvaluation: riskEvaluationResult,
    accountStatus: ChallengeStatus,
  ): Promise<ChallengeStatus> {
    const status = riskEvaluation.status;

    let challengeStatus = accountStatus;
    if (status && challengeStatus !== ChallengeStatus.DISAPPROVABLE) {
      // Lógica para cuenta aprobada
      challengeStatus = ChallengeStatus.APPROVABLE;

      this.logger.debug(
        'Cuenta en estado de aprobación según evaluación de riesgo',
      );
      // Aquí puedes llamar a TasksService.approvedChallenge() si es necesario
    } else {
      // Una cuenta es desaprobable si alguna regla crítica falla (status: false) 
      // y tiene un valor válido (no null)
      const isDissaprovable = 
        (!riskEvaluation.dailyDrawdown.status && riskEvaluation.dailyDrawdown.drawdown !== null) ||
        (!riskEvaluation.maxDrawdown.status && riskEvaluation.maxDrawdown.drawdown !== null) ||
        (!riskEvaluation.inactiveDays.status && riskEvaluation.inactiveDays.inactiveDays !== null) ||
        (!riskEvaluation.globalConsistency.status && riskEvaluation.globalConsistency.consistencyPercentage !== null);

      // Log detallado del estado de cada regla de riesgo
      this.logger.debug('Estado detallado de evaluación de riesgo:', {
        dailyDrawdown: {
          status: riskEvaluation.dailyDrawdown.status,
          value: riskEvaluation.dailyDrawdown.drawdown,
        },
        maxDrawdown: {
          status: riskEvaluation.maxDrawdown.status,
          value: riskEvaluation.maxDrawdown.drawdown,
        },
        inactiveDays: {
          status: riskEvaluation.inactiveDays.status,
          value: riskEvaluation.inactiveDays.inactiveDays,
        },
        globalConsistency: {
          status: riskEvaluation.globalConsistency.status,
          percentage: riskEvaluation.globalConsistency.consistencyPercentage,
        },
        tradingDays: {
          status: riskEvaluation.tradingDays.status,
          value: riskEvaluation.tradingDays.numDays,
        },
        profitTarget: {
          status: riskEvaluation.profitTarget.status,
          profit: riskEvaluation.profitTarget.profit,
          target: riskEvaluation.profitTarget.profitTarget,
        },
        overallStatus: riskEvaluation.status,
        isDissaprovable,
      });

      this.logger.debug(
        `Evaluación de riesgo - Cuenta ${isDissaprovable ? 'desaprobada' : 'aprobada'}`,
      );

      // Lógica para cuenta desaprobada
      if (isDissaprovable) {
        challengeStatus = ChallengeStatus.DISAPPROVABLE;
        this.logger.debug(
          'Cuenta en estado de desaprobación según evaluación de riesgo',
        );
      }
      // Aquí puedes llamar a TasksService.setDesaprobableChallenge() si es necesario
    }
    return challengeStatus;
  }

  /**
   * Ejecuta el proceso completo de desaprobación cuando se rompe alguna regla crítica
   */
  private async handleDisapproval(
    account: Account,
    riskEvaluation: riskEvaluationResult,
  ): Promise<void> {
    try {
      const challengeId = account.challengeId;
      if (!challengeId) {
        this.logger.warn(
          `No se encontró challengeId para login=${account.login}. Saltando desaprobación automática.`,
        );
        return;
      }

      const observationParts: string[] = [];
      if (!riskEvaluation.dailyDrawdown.status) {
        observationParts.push(
          `Daily loss excedida: ${Number(
            riskEvaluation.dailyDrawdown.drawdown,
          ).toFixed(2)}%`,
        );
      }
      if (!riskEvaluation.maxDrawdown.status) {
        observationParts.push(
          `Max loss excedida: ${Number(
            riskEvaluation.maxDrawdown.drawdown,
          ).toFixed(2)}%`,
        );
      }
      if (!riskEvaluation.globalConsistency.status) {
        observationParts.push(
          `Inconsistencia global: ${Number(
            riskEvaluation.globalConsistency.consistencyPercentage,
          ).toFixed(2)}%`,
        );
      }
      if (!riskEvaluation.inactiveDays.status) {
        observationParts.push(
          `Días inactivos excedidos: ${riskEvaluation.inactiveDays.inactiveDays}`,
        );
      }

      const observation =
        observationParts.join(' | ') ||
        'Challenge no cumple con las reglas de riesgo establecidas';

      this.customLogger.logJob({
        jobName: 'RulesEvaluationJob',
        operation: 'auto_disapprove_init',
        status: 'in_progress',
        details: { challenge_id: challengeId, login: account.login },
      });

      await this.challengesService.setDisapprovedChallenge(
        challengeId,
        observation,
      );

      this.customLogger.logJob({
        jobName: 'RulesEvaluationJob',
        operation: 'auto_disapprove_success',
        status: 'completed',
        details: { challenge_id: challengeId, login: account.login },
      });
    } catch (error) {
      this.logger.error('Error en desaprobación automática:', error);
      this.customLogger.logJob({
        jobName: 'RulesEvaluationJob',
        operation: 'auto_disapprove_error',
        status: 'failed',
        details: { error: error?.message || String(error) },
      });
    }
  }
  /**
   * Mapea el resultado de evaluación de riesgo a RiskValidation
   * @param riskParams Resultado de la evaluación
   * @returns RiskValidation para guardar en la cuenta
   */
  private mapToRiskValidation(
    riskEvaluation: riskEvaluationResult,
  ): RiskParams {
    const validation = new RiskParams();
    validation.profitTarget = riskEvaluation.profitTarget.profit;
    validation.dailyDrawdown = riskEvaluation.dailyDrawdown.drawdown;
    validation.tradingDays = riskEvaluation.tradingDays.numDays;
    validation.inactiveDays = riskEvaluation.inactiveDays.inactiveDays;
    return validation;
  }

  /**
   * Recrea una instancia de Account desde un objeto plano para restaurar métodos de clase
   */
  private recreateAccountInstance(accountData: any): Account {
    // Crear nueva instancia de Account
    const account = new Account(accountData.accountID, accountData.login);

    // Copiar todas las propiedades del objeto plano
    Object.assign(account, accountData);

    // Asegurar que las fechas sean objetos Date apropiados
    if (accountData.createDateTime) {
      account.createDateTime = new Date(accountData.createDateTime);
    }
    if (accountData.lastUpdate) {
      account.lastUpdate = new Date(accountData.lastUpdate);
    }

    return account;
  }
}
