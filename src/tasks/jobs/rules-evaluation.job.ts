import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { BufferService } from 'src/lib/buffer/buffer.service';
import { Account, RiskParams, RiskValidation } from 'src/common/utils';
import * as riskFunctions from 'src/common/functions';
import { riskEvaluationResult } from 'src/common/types/risk-results';

@Injectable()
export class RulesEvaluationJob {
  private readonly logger = new Logger(RulesEvaluationJob.name);
  constructor(private readonly bufferService: BufferService) {}

  @Cron(CronExpression.EVERY_10_SECONDS)
  async evaluate() {
    try {
      const stats = this.bufferService.getStats();
      if (stats.bufferSize === 0) {
        this.logger.debug('Buffer vacío, saltando evaluación de reglas');
        return;
      }

      this.logger.debug(
        `Iniciando evaluación de reglas para ${stats.bufferSize} cuentas`,
      );

      // Obtener todas las entradas del buffer
      const entries = await this.bufferService.listEntries();
      let processedCount = 0;
      let validationCount = 0;

      // Procesar cada cuenta individualmente usando upsertAccount
      for (const [login, account] of entries) {
        try {
          // Evaluar reglas de riesgo
          const riskEvaluation = await this.evaluateAccountRules(
            account,
            this.getDefaultRiskParams(), // Usar parámetros por defecto o desde configuración
          );

          // Actualizar la cuenta con los resultados de validación
          await this.bufferService.upsertAccount(login, (prev) => {
            // Crear una nueva instancia de Account manteniendo todos los métodos
            const updated = Object.assign(
              Object.create(Object.getPrototypeOf(prev)),
              prev,
            );
            // Actualizar rulesEvaluation con el resultado completo de la evaluación
            updated.rulesEvaluation = riskEvaluation;
            // También actualizar riskValidation con valores numéricos para compatibilidad
            updated.riskValidation = this.mapToRiskValidation(riskEvaluation);
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
        `RulesEvaluationJob completado: procesadas=${processedCount}/${stats.bufferSize}, validaciones_exitosas=${validationCount}`,
      );
    } catch (error) {
      this.logger.error(`Error en RulesEvaluationJob:`, error);
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

  /**
   * Obtiene los parámetros de riesgo por defecto
   * TODO: Estos deberían venir de configuración o base de datos
   */
  private getDefaultRiskParams(): RiskParams {
    return {
      profitTarget: 10000, // $10,000 profit target
      dailyDrawdown: 5, // 5% daily drawdown
      maxDrawdown: 10, // 10% max drawdown
      lossPerTrade: 1, // 1% loss per trade
      tradingDays: 5, // minimum 5 trading days
      inactiveDays: 5, // maximum 5 consecutive inactive days
    };
  }

  /**
   * Mapea el resultado de evaluación de riesgo a RiskValidation
   * @param riskEvaluation Resultado de la evaluación
   * @returns RiskValidation para guardar en la cuenta
   */
  private mapToRiskValidation(
    riskEvaluation: riskEvaluationResult,
  ): RiskValidation {
    const validation = new RiskValidation();
    validation.profitTarget = riskEvaluation.profitTarget.profit;
    validation.dailyDrawdown = riskEvaluation.dailyDrawdown.drawdown;
    validation.tradingDays = riskEvaluation.tradingDays.numDays;
    validation.inactiveDays = riskEvaluation.inactiveDays.inactiveDays;
    return validation;
  }
}
