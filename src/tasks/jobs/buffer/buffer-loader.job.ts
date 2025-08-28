import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Challenge } from 'src/modules/challenges/entities/challenge.entity';
import { ChallengeRelation } from 'src/modules/challenge-templates/entities/challenge-relation.entity';
import { StageParameter } from 'src/modules/challenge-templates/entities/stage/stage-parameter.entity';
import { ChallengeTemplatesService } from 'src/modules/challenge-templates/challenge-templates.service';
import { BufferService } from 'src/lib/buffer/buffer.service';
import { mapChallengesToAccounts } from 'src/common/utils/account-mapper';

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
    this.logger.debug('BufferLoaderJob: Recarga programada del buffer');
    try {
      await this.loadAccountsToBuffer();
      this.logger.debug('BufferLoaderJob: Recarga programada completada exitosamente');
    } catch (error) {
      this.logger.error(
        'BufferLoaderJob: Error durante la recarga programada: ' + error,
      );
    }
  }

  /**
   * Proceso principal para cargar cuentas desde la base de datos al buffer
   */
  async loadAccountsToBuffer() {
    try {
      this.logger.debug(
        'BufferLoaderJob: Iniciando proceso de carga de cuentas al buffer',
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

      // Mapear challenges a cuentas del buffer
      const accountsForBuffer = mapChallengesToAccounts(activeChallenges);

      this.logger.debug(
        `BufferLoaderJob: Mapeadas ${accountsForBuffer.length} cuentas para el buffer`,
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

      return {
        totalChallenges: activeChallenges.length,
        accountsMapped: accountsForBuffer.length,
        accountsInjected: injectedCount,
        accountsUpdated: updatedCount,
        bufferStats,
      };
    } catch (error) {
      this.logger.error(
        'BufferLoaderJob: Error en el proceso de carga de cuentas al buffer: ' + error,
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