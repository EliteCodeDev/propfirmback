import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { SmtApiClient } from 'src/modules/data/smt-api/client/smt-api.client';
import { CustomLoggerService } from 'src/common/services/custom-logger.service';
@Injectable()
export class DeactivateSmtApiJob {
  private readonly logger = new Logger(DeactivateSmtApiJob.name);
  constructor(
    private readonly smtApiClient: SmtApiClient,
    private readonly customLogger: CustomLoggerService,
  ) {}

  @Cron('0 1 17 * * *')
  async DeactivateSmtApi() {
    const startTime = Date.now();
    
    this.customLogger.logJob({
      jobName: 'DeactivateSmtApiJob',
      operation: 'deactivate_smt_api',
      status: 'started',
      details: { trigger: 'scheduled' }
    });
    
    try {
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
      
      const duration = Date.now() - startTime;
      
      this.customLogger.logJob({
        jobName: 'DeactivateSmtApiJob',
        operation: 'deactivate_smt_api',
        status: 'completed',
        details: { 
          trigger: 'scheduled',
          duration_ms: duration,
          browser_status: broker.status,
          browser_deleted: broker.status
        }
      });
    } catch (error) {
      const duration = Date.now() - startTime;
      
      this.logger.error('DeactivateSmtApiJob: error durante la ejecución: ' + error);
      
      this.customLogger.logJob({
        jobName: 'DeactivateSmtApiJob',
        operation: 'deactivate_smt_api',
        status: 'failed',
        details: { 
          trigger: 'scheduled',
          duration_ms: duration,
          error: error?.message || error.toString()
        }
      });
      
      throw error;
    }
  }
}
