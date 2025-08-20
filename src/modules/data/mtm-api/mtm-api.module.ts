import { Module } from '@nestjs/common';
import { MtmApiService } from './mtm-api.service';
import { MtmApiController } from './mtm-api.controller';

@Module({
  controllers: [MtmApiController],
  providers: [MtmApiService],
})
export class MtmApiModule {}
