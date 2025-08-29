import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { CustomLoggerService } from 'src/common/services/custom-logger.service';

@Injectable()
export class VerifyAccountJob {
  private readonly logger = new Logger(VerifyAccountJob.name);

  constructor(private readonly customLogger: CustomLoggerService) {}

  @Cron('0 */5 * * * *')
  handleCron() {
    const startTime = Date.now();
    this.logger.debug('Called when the current second is 45');
    
    this.customLogger.logJob({
      jobName: 'VerifyAccountJob',
      operation: 'cron_execution',
      status: 'started',
      details: { trigger: 'scheduled' }
    });
    
    try {
      // TODO: Implementar lógica de verificación de cuentas
      const duration = Date.now() - startTime;
      
      this.customLogger.logJob({
        jobName: 'VerifyAccountJob',
        operation: 'cron_execution',
        status: 'completed',
        details: { 
          trigger: 'scheduled',
          duration_ms: duration
        }
      });
    } catch (error) {
      const duration = Date.now() - startTime;
      
      this.customLogger.logJob({
        jobName: 'VerifyAccountJob',
        operation: 'cron_execution',
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
