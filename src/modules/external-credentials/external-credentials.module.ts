import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ExternalCredentialsController } from './external-credentials.controller';
import { ExternalCredentialsService } from './external-credentials.service';
import { ExternalCredential } from './entities/external-credential.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ExternalCredential])],
  controllers: [ExternalCredentialsController],
  providers: [ExternalCredentialsService],
  exports: [ExternalCredentialsService],
})
export class ExternalCredentialsModule {}