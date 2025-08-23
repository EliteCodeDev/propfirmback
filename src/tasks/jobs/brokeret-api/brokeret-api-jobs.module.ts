import { Module } from '@nestjs/common';
import { BrokeretDataExtractorJob } from './brokeret-data-extractor.job';
import { BrokeretDataMapper } from './mappers/brokeret-data.mapper';
import { BrokeretApiModule } from 'src/modules/data/brokeret-api/brokeret-api.module';
import { BufferModule } from 'src/lib/buffer/buffer.module';

@Module({
  imports: [
    BrokeretApiModule, // Importar el módulo de Brokeret API
    BufferModule, // Importar el módulo del buffer
  ],
  providers: [
    BrokeretDataExtractorJob, // El job principal
    BrokeretDataMapper, // El mapper de datos
  ],
  exports: [
    BrokeretDataExtractorJob, // Exportar el job para uso externo si es necesario
    BrokeretDataMapper, // Exportar el mapper para uso externo si es necesario
  ],
})
export class BrokeretApiJobsModule {}
