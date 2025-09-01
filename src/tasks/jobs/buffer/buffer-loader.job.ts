import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Challenge } from 'src/modules/challenges/entities/challenge.entity';
import { ChallengeRelation } from 'src/modules/challenge-templates/entities/challenge-relation.entity';
import { StageParameter } from 'src/modules/challenge-templates/entities/stage/stage-parameter.entity';
import { ChallengeTemplatesService } from 'src/modules/challenge-templates/services/challenge-templates.service';
import { BufferService } from 'src/lib/buffer/buffer.service';
import { mapChallengesToAccounts } from 'src/common/utils/account-mapper';
import { CustomLoggerService } from 'src/common/services/custom-logger.service';

/**
 * Job genérico responsable de cargar cuentas desde la base de datos al buffer
 * Independiente de los proveedores de datos (SMT API, Brokeret API, etc.)
 */
@Injectable()
export class BufferLoaderJob implements OnModuleInit {
  private readonly logger = new Logger(BufferLoaderJob.name);

  constructor(
    @InjectRepository(Challenge)
    private challengeRepository: Repository<Challenge>,
    @InjectRepository(ChallengeRelation)
    private relationRepository: Repository<ChallengeRelation>,
    @InjectRepository(StageParameter)
    private stageParameterRepository: Repository<StageParameter>,
    private readonly challengeTemplatesService: ChallengeTemplatesService,
    private readonly buffer: BufferService,
    private readonly customLogger: CustomLoggerService,
  ) {}

  /**
   * Ejecuta al iniciar el backend para cargar las cuentas iniciales
   */
  onModuleInit() {
    this.logger.debug('BufferLoaderJob: Iniciando carga inicial del buffer');
    // Ejecutar y capturar errores al inicio
    this.loadAccountsToBuffer().catch((err) => {
      this.logger.error(
        'BufferLoaderJob: Error al cargar cuentas iniciales al buffer: ' + err,
      );
    });
  }

  /**
   * Job programado para recargar cuentas cada hora
   * Mantiene el buffer actualizado con los challenges activos
   * Tiene prioridad en la carga inicial antes de que otros jobs procesen datos
   */
  @Cron('0 0 * * * *', { timeZone: 'America/Lima' })
  async scheduledBufferReload() {
    const startTime = Date.now();
    this.logger.debug('BufferLoaderJob: Recarga programada del buffer');
    
    // Log timeline del buffer
    this.customLogger.logBufferTimeline(
      'BufferLoaderJob',
      {
        action: 'scheduled_reload_start',
        metadata: { trigger: 'cron_schedule' }
      },
      'Starting scheduled buffer reload'
    );
    
    try {
      await this.loadAccountsToBuffer();
      const duration = Date.now() - startTime;
      
      this.logger.debug('BufferLoaderJob: Recarga programada completada exitosamente');
      this.customLogger.logBufferTimeline(
        'BufferLoaderJob',
        {
          action: 'scheduled_reload_success',
          duration: duration
        },
        'Scheduled buffer reload completed successfully'
      );
    } catch (error) {
      const duration = Date.now() - startTime;
      
      this.logger.error(
        'BufferLoaderJob: Error durante la recarga programada: ' + error,
      );
      this.customLogger.logBufferTimeline(
        'BufferLoaderJob',
        {
          action: 'scheduled_reload_error',
          duration: duration,
          error: error.message
        },
        'Scheduled buffer reload failed'
      );
    }
  }

  /**
   * Proceso principal para cargar cuentas desde la base de datos al buffer
   */
  async loadAccountsToBuffer() {
    const startTime = Date.now();
    
    try {
      this.logger.debug(
        'BufferLoaderJob: Iniciando proceso de carga de cuentas al buffer',
      );
      
      this.customLogger.logBufferTimeline(
        'BufferLoaderJob',
        {
          action: 'load_accounts_start'
        },
        'Starting accounts load to buffer'
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
          
          this.logger.debug(
            `BufferLoaderJob: Relación cargada para challenge ${challenge.challengeID}`,
          );
        }
      }

      this.logger.debug(
        `BufferLoaderJob: Encontrados ${activeChallenges.length} challenges activos`,
      );
      
      this.customLogger.logBufferTimeline(
        'BufferLoaderJob',
        {
          action: 'challenges_loaded',
          metadata: { active_challenges_count: activeChallenges.length }
        },
        'Active challenges loaded successfully'
      );

      // Mapear challenges a cuentas del buffer
      const accountsForBuffer = mapChallengesToAccounts(activeChallenges);

      this.logger.debug(
        `BufferLoaderJob: Mapeadas ${accountsForBuffer.length} cuentas para el buffer`,
      );
      
      this.customLogger.logBufferTimeline(
        'BufferLoaderJob',
        {
          action: 'accounts_mapped',
          metadata: { mapped_accounts_count: accountsForBuffer.length }
        },
        'Accounts mapped for buffer injection'
      );

      // Inyectar cuentas al buffer
      let injectedCount = 0;
      let updatedCount = 0;
      
      for (const account of accountsForBuffer) {
        try {
          const wasUpdated = await this.buffer.upsertAccount(account.login, (prev) => {
            // Si existe una cuenta previa, mantener los datos de trading actualizados
            // y solo actualizar la configuración del challenge
            if (prev) {
              updatedCount++;
              // Actualizar solo los campos de configuración del challenge
              prev.challengeId = account.challengeId;
              prev.riskValidation = account.riskValidation;
              prev.lastUpdate = account.lastUpdate;
              return prev;
            } else {
              injectedCount++;
              return account;
            }
          });
          
          this.logger.debug(
            `BufferLoaderJob: Cuenta ${account.login} ${wasUpdated ? 'actualizada' : 'inyectada'} en el buffer`,
          );
        } catch (error) {
          this.logger.error(
            `BufferLoaderJob: Error procesando cuenta ${account.login}:`,
            error,
          );
        }
      }

      this.logger.log(
        `BufferLoaderJob: Proceso completado - ${injectedCount} cuentas nuevas, ${updatedCount} cuentas actualizadas`,
      );

      // Log del estado actual del buffer
      const bufferStats = this.buffer.getStats();
      this.logger.debug(
        `BufferLoaderJob: Estado del buffer: ${JSON.stringify(bufferStats)}`,
      );
      
      const duration = Date.now() - startTime;
      
      this.customLogger.logBufferTimeline(
        'BufferLoaderJob',
        {
          action: 'load_accounts_success',
          duration: duration,
          metadata: {
            total_challenges: activeChallenges.length,
            accounts_mapped: accountsForBuffer.length,
            accounts_injected: injectedCount,
            accounts_updated: updatedCount,
            buffer_stats: bufferStats
          }
        },
        'Accounts loaded to buffer successfully'
      );

      return {
        totalChallenges: activeChallenges.length,
        accountsMapped: accountsForBuffer.length,
        accountsInjected: injectedCount,
        accountsUpdated: updatedCount,
        bufferStats,
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      
      this.logger.error(
        'BufferLoaderJob: Error en el proceso de carga de cuentas al buffer: ' + error,
      );
      
      this.customLogger.logBufferTimeline(
        'BufferLoaderJob',
        {
          action: 'load_accounts_error',
          duration: duration,
          error: error.message
        },
        'Failed to load accounts to buffer'
      );
      
      throw error;
    }
  }

  /**
   * Método público para forzar una recarga manual del buffer
   * Útil para testing o cuando se necesita una actualización inmediata
   */
  async forceReload() {
    this.logger.log('BufferLoaderJob: Forzando recarga manual del buffer');
    return await this.loadAccountsToBuffer();
  }

  /**
   * Método para obtener estadísticas del buffer
   */
  getBufferStats() {
    return this.buffer.getStats();
  }
}