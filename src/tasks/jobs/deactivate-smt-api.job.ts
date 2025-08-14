import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { SmtApiClient } from 'src/modules/smt-api/client/smt-api.client';
@Injectable()
export class DeactivateSmtApiJob {
  private readonly logger = new Logger(DeactivateSmtApiJob.name);
  constructor(private readonly smtApiClient: SmtApiClient) {}

  @Cron('0 1 17 * * *')
  async DeactivateSmtApi() {
    const broker = await this.smtApiClient.browserStatus();
    this.logger.debug(
      'DeactivateSmtApiJob: estado del navegador SMT API: ' +
        JSON.stringify(broker),
    );
    if (broker.status) {
      // obtener las cuentas a activar del backend
      await this.smtApiClient.deleteBrowser();
      this.logger.debug('DeactivateSmtApiJob: navegador SMT API eliminado');
    }
  }
}
