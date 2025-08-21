import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VerificationController } from './verification.controller';
import { VerificationService } from './verification.service';
import { Verification } from './entities/verification.entity';
import { Media } from './entities/media.entity';
import { MinioModule } from 'src/modules/storage/minio/minio.module';

@Module({
  imports: [TypeOrmModule.forFeature([Verification, Media]), MinioModule],
  controllers: [VerificationController],
  providers: [VerificationService],
  exports: [VerificationService],
})
export class VerificationModule {}
