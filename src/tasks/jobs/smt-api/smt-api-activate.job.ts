import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { SmtApiClient } from 'src/modules/data/smt-api/client/smt-api.client';
import { Challenge } from 'src/modules/challenges/entities/challenge.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LoginAccount } from 'src/common/utils';
import { BufferLoaderJob } from '../buffer/buffer-loader.job';
import { CustomLoggerService } from 'src/common/services/custom-logger.service';
//inicio de la ejecución
@Injectable()
export class ActivateSmtApiJob implements OnModuleInit {
  private readonly logger = new Logger(ActivateSmtApiJob.name);
  constructor(
    private readonly smtApiClient: SmtApiClient,
    @InjectRepository(Challenge)
    private challengeRepository: Repository<Challenge>,
    private readonly bufferLoaderJob: BufferLoaderJob,
    private readonly customLogger: CustomLoggerService,
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
    const startTime = Date.now();
    this.logger.debug('ActivateSmtApiJob: ejecución programada');
    
    this.customLogger.logJob({
      jobName: 'ActivateSmtApiJob',
      operation: 'activate_smt_api',
      status: 'started',
      details: { trigger: 'scheduled' }
    });
    
    try {
      const response = await this.activateSmtApiProcess();
      const duration = Date.now() - startTime;
      
      this.logger.debug(
        'ActivateSmtApiJob: respuesta de la API: ' + JSON.stringify(response),
      );
      
      this.customLogger.logJob({
        jobName: 'ActivateSmtApiJob',
        operation: 'activate_smt_api',
        status: 'completed',
        details: { 
          trigger: 'scheduled',
          duration_ms: duration,
          response: response
        }
      });
    } catch (error) {
      const duration = Date.now() - startTime;
      
      this.logger.error(
        'ActivateSmtApiJob: error durante la ejecución programada: ' + error,
      );
      
      this.customLogger.logJob({
        jobName: 'ActivateSmtApiJob',
        operation: 'activate_smt_api',
        status: 'failed',
        details: { 
          trigger: 'scheduled',
          duration_ms: duration,
          error: error?.message || error.toString()
        }
      });
      // Re-lanzar si se desea que el scheduler registre fallo
      // throw error;
    }
  }

  async activateSmtApiProcess() {
    try {
      this.logger.debug(
        'ActivateSmtApiJob: ejecución del proceso de activación de cuentas SMT API',
      );

      // Forzar recarga del buffer usando el job genérico
      await this.bufferLoaderJob.forceReload();
      this.logger.debug('ActivateSmtApiJob: Buffer actualizado exitosamente');

      // Obtener challenges activos para activación en SMT API
      const activeChallenges = await this.challengeRepository.find({
        where: { isActive: true },
        relations: ['brokerAccount'],
      });

      this.logger.debug(
        `ActivateSmtApiJob: Encontrados ${activeChallenges.length} challenges activos para SMT API`,
      );

      // Preparar cuentas para activación en SMT API
      const activeAccounts: LoginAccount[] = activeChallenges
        .filter((c) => !!c.brokerAccount)
        .map((c) => ({
          login: c.brokerAccount.login,
          password: c.brokerAccount.password,
          id: c.brokerAccount.brokerAccountID,
          ip: c.brokerAccount.serverIp || '',
          platform: c.brokerAccount.platform || '',
        }));

      this.logger.debug(
        'ActivateSmtApiJob: Número de cuentas a activar en SMT API: ' +
          activeAccounts.length,
      );

      // Activar cuentas en SMT API
      return await this.smtApiClient.loginAll(activeAccounts);
    } catch (error) {
      this.logger.error(
        'ActivateSmtApiJob: error en el proceso de activación de cuentas SMT API: ' +
          error,
      );
      throw error;
    }
  }
}
