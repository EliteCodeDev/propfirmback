import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { BufferService } from 'src/lib/buffer/buffer.service';
import { BrokeretDataExtractorJob } from './brokeret-api/brokeret-data-extractor.job';
import { CustomLoggerService } from 'src/common/services/custom-logger.service';

@Injectable()
export class BufferDataUpdaterJob implements OnModuleInit {
  private readonly logger = new Logger(BufferDataUpdaterJob.name);

  constructor(
    private readonly buffer: BufferService,
    private readonly brokeretExtractor: BrokeretDataExtractorJob,
    private readonly customLogger: CustomLoggerService,
    // Aquí se pueden agregar otros extractores en el futuro
    // private readonly otherProviderExtractor: OtherProviderExtractorJob,
  ) {}

  onModuleInit() {
    this.logger.log('BufferDataUpdaterJob inicializado');
    this.logger.debug('Job configurado para ejecutarse cada 30 segundos');
  }

  /**
   * Job programado para actualizar datos del buffer cada 30 segundos
   * Cron: cada 30 segundos con offset de 15 segundos para dar tiempo a la carga inicial
   */
  @Cron('15,45 * * * * *', { timeZone: 'America/Lima' })
  async updateBufferData() {
    const startTime = Date.now();
    this.logger.log('Iniciando actualización de datos del buffer');
    
    this.customLogger.logBufferTimeline(
      'BufferDataUpdaterJob',
      {
        action: 'data_update_start'
      },
      'Starting buffer data update'
    );

    try {
      await this.updateBufferDataProcess();
      const duration = Date.now() - startTime;
      
      this.logger.log('Actualización de datos del buffer completada exitosamente');
      this.customLogger.logBufferTimeline(
        'BufferDataUpdaterJob',
        {
          action: 'data_update_success',
          duration: duration
        },
        'Buffer data update completed successfully'
      );
    } catch (error) {
      const duration = Date.now() - startTime;
      
      this.logger.error('Error en el proceso de actualización del buffer:', error);
      this.customLogger.logBufferTimeline(
        'BufferDataUpdaterJob',
        {
          action: 'data_update_error',
          duration: duration,
          error: error?.message || error.toString()
        },
        'Buffer data update failed'
      );
    }
  }

  /**
   * Proceso principal de actualización de datos
   */
  private async updateBufferDataProcess() {
    try {
      const stats = this.buffer.getStats();

      if (stats.bufferSize === 0) {
        this.logger.debug('No hay cuentas en el buffer para procesar');
        this.customLogger.logBufferTimeline(
          'BufferDataUpdaterJob',
          {
            action: 'data_update_empty',
            metadata: { buffer_size: 0 }
          },
          'Buffer is empty, no data to update'
        );
        return;
      }

      this.logger.debug(`Procesando ${stats.bufferSize} cuentas del buffer`);
      this.customLogger.logBufferTimeline(
        'BufferDataUpdaterJob',
        {
          action: 'data_update_processing',
          metadata: { 
            buffer_size: stats.bufferSize
          }
        },
        'Processing buffer data update'
      );

      // Llamar a los extractores de datos
      const results = await Promise.allSettled([
        this.brokeretExtractor.extractBrokeretDataProcess(),
        // Aquí se pueden agregar otros proveedores:
        // this.otherProviderExtractor.extractOtherProviderDataProcess(),
      ]);

      // Log de resultados
      results.forEach((result, index) => {
        const providerName = index === 0 ? 'Brokeret' : `Provider-${index}`;
        if (result.status === 'fulfilled') {
          this.logger.debug(`${providerName}: Procesamiento completado exitosamente`);
        } else {
          this.logger.error(`${providerName}: Error en procesamiento:`, result.reason);
        }
      });

      this.logger.debug('Todos los proveedores de datos han sido ejecutados');
    } catch (error) {
      this.logger.error('Error en el proceso de actualización:', error);
      throw error;
    }
  }
}