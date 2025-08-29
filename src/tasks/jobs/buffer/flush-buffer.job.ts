import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { DeepPartial, Repository, In } from 'typeorm';
import { BufferService } from 'src/lib/buffer/buffer.service';
import { Challenge } from 'src/modules/challenges/entities/challenge.entity';
import { ChallengeDetails } from 'src/modules/challenges/entities/challenge-details.entity';
import { Account } from 'src/common/utils';
import { CustomLoggerService } from 'src/common/services/custom-logger.service';

@Injectable()
export class FlushBufferJob {
  private readonly logger = new Logger(FlushBufferJob.name);
  private readonly BATCH_SIZE = 50; // Process accounts in batches
  private readonly MAX_CONCURRENT_BATCHES = 3; // Limit concurrent database operations
  
  // Performance metrics
  private metrics = {
    totalFlushes: 0,
    totalAccountsProcessed: 0,
    totalDirtyAccounts: 0,
    totalPersisted: 0,
    totalSkipped: 0,
    totalFailed: 0,
    averageFlushTime: 0,
    lastFlushTime: 0,
    maxFlushTime: 0,
    minFlushTime: Infinity
  };
  
  constructor(
    private readonly bufferService: BufferService,
    @InjectRepository(Challenge)
    private readonly challengeRepo: Repository<Challenge>,
    @InjectRepository(ChallengeDetails)
    private readonly detailsRepo: Repository<ChallengeDetails>,
    private readonly customLogger: CustomLoggerService,
  ) {}

  // Cada minuto en el segundo 30 para persistir datos actualizados
  @Cron('30 * * * * *')
  async flush() {
    const startTime = Date.now();
    this.logger.debug('FlushBufferJob: iniciando flush optimizado...');
    
    this.customLogger.logBufferTimeline(
      'FlushBufferJob',
      {
        action: 'flush_start'
      },
      'Starting buffer flush'
    );

    try {
      const entries = await this.bufferService.listEntries();
      const total = entries.length;
      
      if (total === 0) {
        this.logger.debug('FlushBufferJob: no hay cuentas en buffer');
        this.customLogger.logBufferTimeline(
          'FlushBufferJob',
          {
            action: 'flush_empty',
            duration: Date.now() - startTime
          },
          'Buffer is empty, nothing to flush'
        );
        return;
      }

      // Filter only dirty accounts that need to be persisted
      const dirtyAccounts: Array<{ login: string; account: Account }> = [];
      
      for (const [login] of entries) {
        const accountData = this.bufferService.getBuffer(login);
        if (accountData) {
          // Recreate Account instance from plain object to restore methods
          const account = this.recreateAccountInstance(accountData);
          if (account.isDirty()) {
            dirtyAccounts.push({ login, account });
          }
        }
      }

      this.logger.debug(
        `FlushBufferJob: procesando ${dirtyAccounts.length} cuentas dirty de ${total} totales`
      );

      if (dirtyAccounts.length === 0) {
        this.logger.debug('FlushBufferJob: no hay cuentas dirty para procesar');
        this.customLogger.logBufferTimeline(
          'FlushBufferJob',
          {
            action: 'flush_no_dirty',
            duration: Date.now() - startTime,
            metadata: { 
              total_accounts: total
            }
          },
          'No dirty accounts to flush'
        );
        return;
      }

      // Process accounts in batches for better performance
      const batches = this.createBatches(dirtyAccounts, this.BATCH_SIZE);
      
      // Process batches with controlled concurrency
      const results = await this.processBatchesConcurrently(batches);
      
      const totalPersisted = results.reduce((sum, r) => sum + r.persisted, 0);
      const totalSkipped = results.reduce((sum, r) => sum + r.skipped, 0);
      const totalFailed = results.reduce((sum, r) => sum + r.failed, 0);
      
      const duration = Date.now() - startTime;
       
       // Update performance metrics
       this.updateMetrics({
         duration,
         totalAccounts: total,
         dirtyAccounts: dirtyAccounts.length,
         persisted: totalPersisted,
         skipped: totalSkipped,
         failed: totalFailed
       });
       
       this.logger.debug(
         `FlushBufferJob: completado en ${duration}ms -> ` +
         `total=${total} dirty=${dirtyAccounts.length} persisted=${totalPersisted} ` +
         `skipped=${totalSkipped} failed=${totalFailed} batches=${batches.length}`
       );
       
       this.customLogger.logBufferTimeline(
         'FlushBufferJob',
         {
           action: 'flush_success',
           duration: duration,
           metadata: {
             total_accounts: total,
             dirty_accounts: dirtyAccounts.length,
             persisted_count: totalPersisted,
             skipped_count: totalSkipped,
             failed_count: totalFailed,
             batches_count: batches.length
           }
         },
         'Buffer flush completed successfully'
       );
       
       // Log performance summary every 10 flushes
       if (this.metrics.totalFlushes % 10 === 0) {
         this.logPerformanceMetrics();
       }
    } catch (error) {
      const duration = Date.now() - startTime;
      
      this.logger.error(`FlushBufferJob: error general: ${error?.message || error}`);
      
      this.customLogger.logBufferTimeline(
         'FlushBufferJob',
         {
           action: 'flush_error',
           duration: duration,
           error: error?.message || error.toString()
         },
         'Buffer flush failed'
       );
      
      throw error;
    }
  }

  /**
   * Recreates an Account instance from a plain object to restore class methods
   */
  private recreateAccountInstance(accountData: any): Account {
    // Create new Account instance
    const account = new Account(accountData.accountID, accountData.login);
    
    // Copy all properties from the plain object
    Object.assign(account, accountData);
    
    // Ensure dates are proper Date objects
    if (accountData.createDateTime) {
      account.createDateTime = new Date(accountData.createDateTime);
    }
    if (accountData.lastUpdate) {
      account.lastUpdate = new Date(accountData.lastUpdate);
    }
    
    return account;
  }

  /**
   * Creates batches of accounts for processing
   */
  private createBatches<T>(items: T[], batchSize: number): T[][] {
    const batches: T[][] = [];
    for (let i = 0; i < items.length; i += batchSize) {
      batches.push(items.slice(i, i + batchSize));
    }
    return batches;
  }

  /**
   * Processes batches with controlled concurrency
   */
  private async processBatchesConcurrently(
    batches: Array<{ login: string; account: Account }[]>
  ): Promise<Array<{ persisted: number; skipped: number; failed: number }>> {
    const semaphore = new Array(this.MAX_CONCURRENT_BATCHES).fill(null);
    
    return Promise.all(
      batches.map(async (batch, index) => {
        // Wait for available slot
        await new Promise<void>(resolve => {
          const checkSlot = () => {
            const availableIndex = semaphore.findIndex(slot => slot === null);
            if (availableIndex !== -1) {
              semaphore[availableIndex] = index;
              resolve();
            } else {
              setTimeout(checkSlot, 10);
            }
          };
          checkSlot();
        });

        try {
          return await this.processBatch(batch, index);
        } finally {
          const slotIndex = semaphore.indexOf(index);
          if (slotIndex !== -1) {
            semaphore[slotIndex] = null;
          }
        }
      })
    );
  }

  /**
   * Processes a single batch of accounts using bulk operations
   */
  private async processBatch(
    accountEntries: Array<{ login: string; account: Account }>,
    batchIndex: number
  ): Promise<{ persisted: number; skipped: number; failed: number }> {
    this.logger.debug(
      `FlushBufferJob: procesando batch ${batchIndex + 1} con ${accountEntries.length} cuentas`
    );
    
    let persisted = 0;
    let skipped = 0;
    let failed = 0;

    try {
      // Get all logins for this batch
      const logins = accountEntries.map(entry => entry.login);
      
      // Bulk fetch all challenges for this batch using optimized query
      const challenges = await this.challengeRepo
        .createQueryBuilder('c')
        .innerJoinAndSelect('c.brokerAccount', 'ba')
        .leftJoin('c.details', 'cd')
        .where('ba.login IN (:...logins)', { logins })
        .andWhere('c.isActive = :isActive', { isActive: true })
        .orderBy('c.startDate', 'DESC')
        .getMany();

      // Create a map for quick lookup
      const challengeMap = new Map<string, Challenge>();
      challenges.forEach(challenge => {
        challengeMap.set(challenge.brokerAccount.login, challenge);
      });

      // Prepare bulk upsert data
      const challengeDetailsToSave: DeepPartial<ChallengeDetails>[] = [];
      const accountsToMarkClean: Account[] = [];

      for (const { login, account } of accountEntries) {
        try {
          const challenge = challengeMap.get(login);
          
          if (!challenge) {
            this.logger.warn(
              `FlushBufferJob: no se encontró Challenge activo para login=${login}`
            );
            skipped++;
            continue;
          }

          // Extract positions from the PositionsClassType structure
          const openPositions = account.openPositions?.positions ?? [];
          const closedPositions = account.closedPositions?.positions ?? [];

          const payload: DeepPartial<ChallengeDetails> = {
            challengeID: challenge.challengeID,
            metaStats: account.metaStats ?? null,
            positions: {
              openPositions,
              closedPositions,
            },
            rulesValidation: account.rulesEvaluation ?? null,
            lastUpdate: account.lastUpdate
              ? new Date(account.lastUpdate)
              : new Date(),
          };

          challengeDetailsToSave.push(payload);
          accountsToMarkClean.push(account);
        } catch (err) {
          this.logger.error(
            `FlushBufferJob: error preparando datos para login=${login}: ${err?.message || err}`
          );
          failed++;
        }
      }

      // Bulk save all challenge details for this batch
      if (challengeDetailsToSave.length > 0) {
        const details = this.detailsRepo.create(challengeDetailsToSave);
        await this.detailsRepo.save(details);
        
        // Mark accounts as clean after successful save
        accountsToMarkClean.forEach(account => account.markAsClean());
        
        persisted = challengeDetailsToSave.length;
        
        this.logger.debug(
          `FlushBufferJob: batch ${batchIndex + 1} completado - ` +
          `persistido=${persisted} omitido=${skipped} fallido=${failed}`
        );
      }
    } catch (error) {
      this.logger.error(
        `FlushBufferJob: error procesando batch ${batchIndex + 1}: ${error?.message || error}`
      );
      failed = accountEntries.length; // Mark all as failed
    }

    return { persisted, skipped, failed };
   }

   /**
    * Updates performance metrics
    */
   private updateMetrics(data: {
     duration: number;
     totalAccounts: number;
     dirtyAccounts: number;
     persisted: number;
     skipped: number;
     failed: number;
   }): void {
     this.metrics.totalFlushes++;
     this.metrics.totalAccountsProcessed += data.totalAccounts;
     this.metrics.totalDirtyAccounts += data.dirtyAccounts;
     this.metrics.totalPersisted += data.persisted;
     this.metrics.totalSkipped += data.skipped;
     this.metrics.totalFailed += data.failed;
     
     this.metrics.lastFlushTime = data.duration;
     this.metrics.maxFlushTime = Math.max(this.metrics.maxFlushTime, data.duration);
     this.metrics.minFlushTime = Math.min(this.metrics.minFlushTime, data.duration);
     
     // Calculate rolling average
     this.metrics.averageFlushTime = 
       (this.metrics.averageFlushTime * (this.metrics.totalFlushes - 1) + data.duration) / 
       this.metrics.totalFlushes;
   }

   /**
    * Logs performance metrics summary
    */
   private logPerformanceMetrics(): void {
     const efficiency = this.metrics.totalAccountsProcessed > 0 
       ? (this.metrics.totalDirtyAccounts / this.metrics.totalAccountsProcessed * 100).toFixed(2)
       : '0.00';
     
     const successRate = this.metrics.totalDirtyAccounts > 0
       ? (this.metrics.totalPersisted / this.metrics.totalDirtyAccounts * 100).toFixed(2)
       : '0.00';

     this.logger.log(
       `FlushBufferJob Performance Metrics (${this.metrics.totalFlushes} flushes):\n` +
       `  • Accounts Processed: ${this.metrics.totalAccountsProcessed}\n` +
       `  • Dirty Accounts: ${this.metrics.totalDirtyAccounts} (${efficiency}% efficiency)\n` +
       `  • Persisted: ${this.metrics.totalPersisted} (${successRate}% success rate)\n` +
       `  • Skipped: ${this.metrics.totalSkipped}\n` +
       `  • Failed: ${this.metrics.totalFailed}\n` +
       `  • Avg Flush Time: ${this.metrics.averageFlushTime.toFixed(2)}ms\n` +
       `  • Min/Max Flush Time: ${this.metrics.minFlushTime}ms / ${this.metrics.maxFlushTime}ms\n` +
       `  • Last Flush Time: ${this.metrics.lastFlushTime}ms`
     );
   }

   /**
    * Gets current performance metrics (for monitoring/health checks)
    */
   getMetrics() {
     return { ...this.metrics };
   }

   /**
    * Resets performance metrics
    */
   resetMetrics(): void {
     this.metrics = {
       totalFlushes: 0,
       totalAccountsProcessed: 0,
       totalDirtyAccounts: 0,
       totalPersisted: 0,
       totalSkipped: 0,
       totalFailed: 0,
       averageFlushTime: 0,
       lastFlushTime: 0,
       maxFlushTime: 0,
       minFlushTime: Infinity
     };
   }
}
