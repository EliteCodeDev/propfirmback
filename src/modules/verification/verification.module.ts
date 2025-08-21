import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VerificationController } from './verification.controller';
import { VerificationService } from './verification.service';
import { Verification } from './entities/verification.entity';
import { Media } from './entities/media.entity';
import { MinioModule } from 'src/modules/storage/minio/minio.module';
import { MailerModule } from '../mailer/mailer.module';
import { UserAccount } from '../users/entities';
@Module({
  imports: [
    TypeOrmModule.forFeature([Verification, Media, UserAccount]),
    MinioModule,
    MailerModule,
  ],
  controllers: [VerificationController],
  providers: [VerificationService],
  exports: [VerificationService],
})
export class VerificationModule {}
