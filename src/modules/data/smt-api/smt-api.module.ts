import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { SmtApiService } from './smt-api.service';
import { SmtApiClient } from './client/smt-api.client';
import { BufferModule } from 'src/lib/buffer/buffer.module';
import { SmtAccountDataTransformPipe } from './pipes/smt-account-data-transform.pipe';
import { smtApiConfig } from 'src/config';

@Module({
  imports: [
    HttpModule, 
    ConfigModule.forFeature(smtApiConfig), 
    BufferModule
  ],
  providers: [SmtApiService, SmtApiClient, SmtAccountDataTransformPipe],
  exports: [SmtApiService, SmtApiClient, SmtAccountDataTransformPipe],
})
export class SmtApiModule {}
