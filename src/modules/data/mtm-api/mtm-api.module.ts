import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { MtmApiService } from './mtm-api.service';
import { MtmApiController } from './mtm-api.controller';
import { MtmApiClient } from './client/mtm-api.client';
import { mtmApiConfig } from 'src/config';

@Module({
  imports: [HttpModule, ConfigModule.forFeature(mtmApiConfig)],
  controllers: [MtmApiController],
  providers: [MtmApiService, MtmApiClient],
  exports: [MtmApiClient],
})
export class MtmApiModule {}
