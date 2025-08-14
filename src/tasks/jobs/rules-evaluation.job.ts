import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { BufferService } from 'src/lib/buffer/buffer.service';
import { Account } from 'src/common/utils/account';
import * as riskFunctions from 'src/common/functions';

@Injectable()
export class RulesEvaluationJob {
  private readonly logger = new Logger(RulesEvaluationJob.name);
  constructor(private readonly buffer: BufferService) {}

  @Cron(CronExpression.EVERY_10_SECONDS)
  async evaluate() {
    // Verificar si hay cuentas en el buffer
    const bufferSize = await this.buffer.size();
    if (bufferSize === 0) {
      this.logger.debug('Buffer vacío, saltando evaluación de reglas');
      return;
    }

    this.logger.debug(
      `Iniciando evaluación de reglas para ${bufferSize} cuentas`,
    );

    // Procesar todas las cuentas en paralelo usando el nuevo método optimizado
    const results = await this.buffer.processAllParallel(
      async (id: string, account: Account) => {
        // Aplicar funciones de evaluación de riesgo
        const validation = await this.evaluateAccountRules(account);

        // Actualizar la cuenta con los resultados de validación
        await this.buffer.upsertAccount(id, (prevAccount) => {
          const updatedAccount = prevAccount || account;
          updatedAccount.riskValidation = {
            updatedAt: new Date(),
            breaches: validation.breaches || [],
          };
          return updatedAccount;
        });

        return {
          id,
          processed: true,
          breaches: validation.breaches?.length || 0,
        };
      },
      {
        skipEmpty: true,
        logErrors: true,
      },
    );

    // Calcular estadísticas del procesamiento
    const successful = results.filter((r) => r !== null).length;
    const totalBreaches = results
      .filter((r) => r !== null)
      .reduce((sum, r) => sum + (r as any).breaches, 0);

    this.logger.debug(
      `RulesEvaluationJob completado: procesadas=${successful}/${bufferSize}, infracciones=${totalBreaches}`,
    );

    // Log estadísticas del buffer
    // const stats = await this.buffer.getStats();
    // this.logger.debug(
    //   `Buffer stats: total=${stats.total}, conValidación=${stats.withValidation}, conInfracciones=${stats.withBreaches}`
    // );
  }

  /**
   * Evalúa las reglas de riesgo para una cuenta específica
   * @param account Cuenta a evaluar
   * @returns Resultado de la evaluación
   */
  private async evaluateAccountRules(account: Account): Promise<{
    breaches: string[];
    riskScore?: number;
  }> {
    try {
      // Aquí se pueden aplicar las funciones de riesgo específicas
      // Por ahora, implementación básica que se puede expandir
      const breaches: string[] = [];

      // Ejemplo de evaluaciones que se pueden implementar:
      // - Verificar drawdown máximo
      // - Verificar profit target
      // - Verificar trading days
      // - Verificar lot size limits
      // - etc.

      // TODO: Implementar evaluaciones específicas usando riskFunctions
      // const riskEvaluation = await riskFunctions.evaluateRisk(account);

      return {
        breaches,
        riskScore: 0, // Placeholder
      };
    } catch (error) {
      this.logger.error(`Error evaluando reglas para cuenta:`, error);
      return {
        breaches: ['EVALUATION_ERROR'],
        riskScore: -1,
      };
    }
  }
}
