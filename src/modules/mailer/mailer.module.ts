import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MailerService } from './mailer.service';
import { mailerConfig } from '../../config';
import { MailerController } from './mailer.controller';

@Module({
  imports: [ConfigModule.forFeature(mailerConfig)],
  providers: [MailerService],
  exports: [MailerService],
  controllers: [MailerController],
})
export class MailerModule {}
