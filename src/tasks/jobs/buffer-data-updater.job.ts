import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { BufferService } from 'src/lib/buffer/buffer.service';
import { BrokeretDataExtractorJob } from './brokeret-api/brokeret-data-extractor.job';

@Injectable()
export class BufferDataUpdaterJob implements OnModuleInit {
  private readonly logger = new Logger(BufferDataUpdaterJob.name);

  constructor(
    private readonly buffer: BufferService,
    private readonly brokeretExtractor: BrokeretDataExtractorJob,
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
    this.logger.log('Iniciando actualización de datos del buffer');

    try {
      await this.updateBufferDataProcess();
      this.logger.log('Actualización de datos del buffer completada exitosamente');
    } catch (error) {
      this.logger.error('Error en el proceso de actualización del buffer:', error);
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
        return;
      }

      this.logger.debug(`Procesando ${stats.bufferSize} cuentas del buffer`);

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