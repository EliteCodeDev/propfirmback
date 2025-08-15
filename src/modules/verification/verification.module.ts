import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VerificationController } from './verification.controller';
import { VerificationService } from './verification.service';
import { Verification } from './entities/verification.entity';
import { Media } from './entities/media.entity';
import { StorageService } from 'src/modules/storage/storage.service';

@Module({
  imports: [TypeOrmModule.forFeature([Verification, Media])],
  controllers: [VerificationController],
  providers: [VerificationService, StorageService],
  exports: [VerificationService],
})
export class VerificationModule {}
