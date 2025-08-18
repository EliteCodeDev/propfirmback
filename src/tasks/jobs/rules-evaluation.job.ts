import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { BufferService } from 'src/lib/buffer/buffer.service';
import { Account } from 'src/common/utils/account';
import * as riskFunctions from 'src/common/functions';
import { RiskParams } from 'src/common/utils';
import { riskEvaluationResult } from 'src/common/types/risk-results';

@Injectable()
export class RulesEvaluationJob {
  private readonly logger = new Logger(RulesEvaluationJob.name);
  constructor(private readonly buffer: BufferService) {}

  @Cron(CronExpression.EVERY_10_SECONDS)
  async evaluate() {
    // Verificar si hay cuentas en el buffer
    // try {
    //   const bufferSize = await this.buffer.getSize();
    //   if (bufferSize === 0) {
    //     this.logger.debug('Buffer vacío, saltando evaluación de reglas');
    //     return;
    //   }

    //   this.logger.debug(
    //     `Iniciando evaluación de reglas para ${bufferSize} cuentas`,
    //   );

    //   // Procesar todas las cuentas en paralelo usando el nuevo método optimizado
    //   const results = await this.buffer.processAllParallel(
    //     async (id: string, account: Account) => {
    //       // Aplicar funciones de evaluación de riesgo
    //       const validation = await this.evaluateAccountRules(
    //         account,
    //         {} as RiskParams,
    //       );

    //       return {
    //         id,
    //         validation,
    //       };
    //     },
    //     {
    //       skipEmpty: true,
    //       logErrors: true,
    //     },
    //   );

    //   // Calcular estadísticas del procesamiento
    //   const successful = results.filter((r) => r !== null).length;

    //   this.logger.debug(
    //     `RulesEvaluationJob completado: procesadas=${successful}/${bufferSize}, 
    //   validaciones=${results.filter((r) => r !== null && r.validation).length}`,
    //   );
    // } catch (error) {
    //   this.logger.error(`Error en RulesEvaluationJob: `, error);
    // }
  }

  /**
   * Evalúa las reglas de riesgo para una cuenta específica
   * @param account Cuenta a evaluar
   * @returns Resultado de la evaluación
   */
  private async evaluateAccountRules(
    account: Account,
    RiskParams: RiskParams,
  ): Promise<riskEvaluationResult> {
    try {
      // Aquí se pueden aplicar las funciones de riesgo específicas
      // Por ahora, implementación básica que se puede expandir
      // const breaches: string[] = [];

      const riskEvaluation = riskFunctions.riskEvaluation(account, RiskParams);

      // TODO: Implementar evaluaciones específicas usando riskFunctions
      // const riskEvaluation = await riskFunctions.evaluateRisk(account);

      return riskEvaluation;
    } catch (error) {
      this.logger.error(`Error evaluando reglas para cuenta:`, error);
      return {} as riskEvaluationResult;
    }
  }
}
