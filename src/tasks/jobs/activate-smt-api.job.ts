import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { SmtApiClient } from 'src/modules/smt-api/client/smt-api.client';
import { Challenge } from 'src/modules/challenges/entities/challenge.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LoginAccount } from 'src/common/utils';
//inicio de la ejecución
@Injectable()
export class ActivateSmtApiJob implements OnModuleInit {
  private readonly logger = new Logger(ActivateSmtApiJob.name);
  constructor(
    private readonly smtApiClient: SmtApiClient,
    @InjectRepository(Challenge)
    private challengeRepository: Repository<Challenge>,
  ) {}

  // Ejecuta al iniciar el backend
  onModuleInit() {
    this.logger.debug('ActivateSmtApiJob: ejecución on startup');
    this.activateSmtApi();
  }

  // Todos los días a las 18:00:00 (con segundos) en la zona horaria indicada
  @Cron('0 45 17 * * *', { timeZone: 'America/Lima' })
  async activateSmtApi() {
    this.logger.debug('ActivateSmtApiJob: ejecución programada');
    const response = await this.activateSmtApiProcess();
    this.logger.debug(
      'ActivateSmtApiJob: respuesta de la API: ' + JSON.stringify(response),
    );
  }

  async activateSmtApiProcess() {
    const broker = await this.smtApiClient.browserStatus();
    this.logger.debug(
      'ActivateSmtApiJob: estado del navegador SMT API: ' +
        JSON.stringify(broker),
    );
    if (!broker.status) {
      // obtener las cuentas a activar del backend
      await this.smtApiClient.createBrowser();
      this.logger.debug('ActivateSmtApiJob: navegador SMT API creado');
    }

    const activeChallenges = await this.challengeRepository.find({
      where: { isActive: true },
      relations: ['brokerAccount'],
    });
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
      'ActivateSmtApiJob: Número de cuentas a activar: ' +
        activeAccounts.length,
    );

    //meter cuentas en el buffer

    // activar cuentas

    return await this.smtApiClient.loginAll(activeAccounts);
  }
}
