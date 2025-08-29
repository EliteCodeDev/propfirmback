import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BufferService } from 'src/lib/buffer/buffer.service';
import { Challenge } from 'src/modules/challenges/entities/challenge.entity';
import { CustomLoggerService } from 'src/common/services/custom-logger.service';

@Injectable()
export class UpdateDailyBalanceJob {
  private readonly logger = new Logger(UpdateDailyBalanceJob.name);
  
  constructor(
    private readonly bufferService: BufferService,
    @InjectRepository(Challenge)
    private readonly challengeRepo: Repository<Challenge>,
    private readonly customLogger: CustomLoggerService,
  ) {}

  @Cron('10 0 17 * * *', { timeZone: 'America/Lima' })
  async updateDailyBalance() {
    const startTime = Date.now();
    
    this.customLogger.logJob({
      jobName: 'UpdateDailyBalanceJob',
      operation: 'update_daily_balance',
      status: 'started',
      details: {
        trigger: 'scheduled',
        timezone: 'America/Lima'
      }
    });
    
    this.logger.log('Iniciando actualización de balance diario');
    
    try {
      const entries = await this.bufferService.listEntries();
      const total = entries.length;
      
      if (total === 0) {
        this.logger.debug('No hay cuentas en el buffer para procesar');
        
        this.customLogger.logJob({
          jobName: 'UpdateDailyBalanceJob',
          operation: 'update_daily_balance_empty',
          status: 'completed',
          details: {
            trigger: 'scheduled',
            duration_ms: Date.now() - startTime,
            buffer_size: 0
          }
        });
        
        return;
      }

      this.logger.debug(`Procesando ${total} cuentas del buffer`);
      
      this.customLogger.logJob({
        jobName: 'UpdateDailyBalanceJob',
        operation: 'update_daily_balance_processing',
        status: 'in_progress',
        details: {
          trigger: 'scheduled',
          buffer_size: total
        }
      });

    let updated = 0;
    let skipped = 0;
    let failed = 0;

    for (const [login] of entries) {
      this.logger.debug(`Procesando cuenta ${login}`);
      try {
        await this.bufferService.withLock(login, async () => {
          this.logger.debug(
            `UpdateDailyBalanceJob: procesando ${login} - lock obtenido`,
          );
          
          // 1) Obtener snapshot del estado actual del buffer
          const current = this.bufferService.getBuffer(login);
          if (!current) {
            skipped++;
            return;
          }

          const currentBalance = current.balance?.currentBalance;
          if (currentBalance === undefined || currentBalance === null) {
            this.logger.warn(
              `UpdateDailyBalanceJob: no se encontró currentBalance para login=${login}`,
            );
            skipped++;
            return;
          }

          // 2) Resolver challenge activo por login de broker account
          const challenge = await this.challengeRepo
            .createQueryBuilder('c')
            .innerJoin('c.brokerAccount', 'ba')
            .where('ba.login = :login', { login })
            .andWhere('c.isActive = :isActive', { isActive: true })
            .orderBy('c.startDate', 'DESC')
            .getOne();

          if (!challenge) {
            this.logger.warn(
              `UpdateDailyBalanceJob: no se encontró Challenge activo para login=${login}`,
            );
            skipped++;
            return;
          }

          // 3) Actualizar el campo dynamicBalance del challenge
          await this.challengeRepo.update(
            { challengeID: challenge.challengeID },
            { dynamicBalance: currentBalance }
          );

          this.logger.debug(
            `UpdateDailyBalanceJob: dynamicBalance actualizado para challengeID=${challenge.challengeID} con valor=${currentBalance}`,
          );
          
          // 4) Actualizar también el dailyBalance en el buffer
          current.balance.dailyBalance = currentBalance;
          
          updated++;
        });
      } catch (err) {
        failed++;
        this.logger.error(
          `UpdateDailyBalanceJob: error al procesar login=${login}: ${err?.message || err}`,
        );
      }
    }

      this.logger.log(
        `UpdateDailyBalanceJob: fin actualización -> total=${total} updated=${updated} skipped=${skipped} failed=${failed}`,
      );
      
      const duration = Date.now() - startTime;
      
      this.customLogger.logJob({
        jobName: 'UpdateDailyBalanceJob',
        operation: 'update_daily_balance_success',
        status: 'completed',
        details: {
          trigger: 'scheduled',
          duration_ms: duration,
          total_accounts: total,
          updated_count: updated,
          skipped_count: skipped,
          failed_count: failed
        }
      });
    } catch (error) {
      const duration = Date.now() - startTime;
      
      this.logger.error(`Error en UpdateDailyBalanceJob:`, error);
      
      this.customLogger.logJob({
        jobName: 'UpdateDailyBalanceJob',
        operation: 'update_daily_balance_error',
        status: 'failed',
        details: {
          trigger: 'scheduled',
          duration_ms: duration,
          error: error?.message || error.toString()
        }
      });
    }
  }
}
