import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { SmtApiClient } from 'src/modules/data/smt-api/client/smt-api.client';
import { Challenge } from 'src/modules/challenges/entities/challenge.entity';
import { ChallengeRelation } from 'src/modules/challenge-templates/entities/challenge-relation.entity';
import { StageParameter } from 'src/modules/challenge-templates/entities/stage/stage-parameter.entity';
import { ChallengeTemplatesService } from 'src/modules/challenge-templates/challenge-templates.service';

import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Account, LoginAccount } from 'src/common/utils';
import { BufferService } from 'src/lib/buffer/buffer.service';
import { brokers } from 'src/examples/brokers';
import { mapChallengesToAccounts } from 'src/common/utils/account-mapper';
import { array } from 'joi';
//inicio de la ejecución
@Injectable()
export class ActivateSmtApiJob implements OnModuleInit {
  private readonly logger = new Logger(ActivateSmtApiJob.name);
  constructor(
    private readonly smtApiClient: SmtApiClient,
    @InjectRepository(Challenge)
    private challengeRepository: Repository<Challenge>,
    @InjectRepository(ChallengeRelation)
    private relationRepository: Repository<ChallengeRelation>,
    @InjectRepository(StageParameter)
    private stageParameterRepository: Repository<StageParameter>,
    private readonly challengeTemplatesService: ChallengeTemplatesService,

    private readonly buffer: BufferService,
  ) {}

  // Ejecuta al iniciar el backend
  onModuleInit() {
    this.logger.debug('ActivateSmtApiJob: ejecución on startup');
    console.log('ActivateSmtApiJob: ejecución on startup');
    // Ejecutar y capturar errores al inicio
    this.activateSmtApi().catch((err) => {
      this.logger.error(
        'ActivateSmtApiJob: error al ejecutar en startup: ' + err,
      );
    });
  }

  // Todos los días a las 18:00:00 (con segundos) en la zona horaria indicada
  @Cron('0 45 17 * * *', { timeZone: 'America/Lima' })
  async activateSmtApi() {
    this.logger.debug('ActivateSmtApiJob: ejecución programada');
    try {
      const response = await this.activateSmtApiProcess();
      this.logger.debug(
        'ActivateSmtApiJob: respuesta de la API: ' + JSON.stringify(response),
      );
    } catch (error) {
      this.logger.error(
        'ActivateSmtApiJob: error durante la ejecución programada: ' + error,
      );
      // Re-lanzar si se desea que el scheduler registre fallo
      // throw error;
    }
  }

  async activateSmtApiProcess() {
    try {
      // const broker = await this.smtApiClient.browserStatus();
      // this.logger.debug(
      //   'ActivateSmtApiJob: estado del navegador SMT API: ' +
      //     JSON.stringify(broker),
      // );
      // if (!broker.status) {
      //   // obtener las cuentas a activar del backend
      //   // await this.smtApiClient.createBrowser();
      //   this.logger.debug('ActivateSmtApiJob: navegador SMT API creado');
      // }
      this.logger.debug(
        'ActivateSmtApiJob: ejecución del proceso de activación de cuentas',
      );

      // Cargar challenges activos con todas las relaciones necesarias
      const activeChallenges = await this.challengeRepository.find({
        where: { isActive: true },
        relations: ['brokerAccount', 'details'],
      });
      
      // Cargar la cadena completa de relaciones para cada challenge
      for (const challenge of activeChallenges) {
        if (challenge.relationID) {
          challenge.relation = await this.challengeTemplatesService.findCompleteRelationChain(
            challenge.relationID,
          );
          
          console.log(
            'CHALLENGE RELATION',
            JSON.stringify(challenge.relation.stages),
          );
        }
      }
      this.logger.debug(
        `ActivateSmtApiJob: Encontrados ${activeChallenges.length} challenges activos`,
      );

      // Mapear challenges a cuentas del buffer
      const accountsForBuffer = mapChallengesToAccounts(activeChallenges);

      this.logger.debug(
        `ActivateSmtApiJob: Mapeadas ${accountsForBuffer.length} cuentas para el buffer`,
      );

      // Inyectar cuentas al buffer
      let injectedCount = 0;
      for (const account of accountsForBuffer) {
        try {
          await this.buffer.upsertAccount(account.login, () => account);
          injectedCount++;
          this.logger.debug(
            `ActivateSmtApiJob: Cuenta ${account.login} inyectada al buffer`,
          );
        } catch (error) {
          this.logger.error(
            `ActivateSmtApiJob: Error inyectando cuenta ${account.login} al buffer:`,
            error,
          );
        }
      }

      this.logger.debug(
        `ActivateSmtApiJob: ${injectedCount}/${accountsForBuffer.length} cuentas inyectadas al buffer exitosamente`,
      );
      //listar accounts del buffer:
      this.logger.debug(
        `ActivateSmtApiJob: Cuentas en el buffer: ${JSON.stringify(
          this.buffer.listEntries(),
        )}`,
      );

      // // Preparar cuentas para activación en SMT API
      // const activeAccounts: LoginAccount[] = activeChallenges
      //   .filter((c) => !!c.brokerAccount)
      //   .map((c) => ({
      //     login: c.brokerAccount.login,
      //     password: c.brokerAccount.password,
      //     id: c.brokerAccount.brokerAccountID,
      //     ip: c.brokerAccount.serverIp || '',
      //     platform: c.brokerAccount.platform || '',
      //   }));

      // this.logger.debug(
      //   'ActivateSmtApiJob: Número de cuentas a activar en SMT API: ' +
      //     activeAccounts.length,
      // );

      // // Activar cuentas en SMT API
      // return await this.smtApiClient.loginAll(activeAccounts);
    } catch (error) {
      this.logger.error(
        'ActivateSmtApiJob: error en el proceso de activación de cuentas: ' +
          error,
      );
      throw error;
    }
  }
}
