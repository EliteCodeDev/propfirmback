import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { BrokeretApiService } from './brokeret-api.service';
import { BrokeretApiController } from './brokeret-api.controller';
import { BrokeretApiClient } from './client/brokeret-api.client';
import { brokeretApiConfig } from 'src/config';

@Module({
  imports: [HttpModule, ConfigModule.forFeature(brokeretApiConfig)],
  controllers: [BrokeretApiController],
  providers: [BrokeretApiService, BrokeretApiClient],
  exports: [BrokeretApiClient],
})
export class BrokeretApiModule {}
