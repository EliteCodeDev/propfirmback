import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MailerService } from './mailer.service';
import { mailerConfig } from '../../config';

@Module({
  imports: [ConfigModule.forFeature(mailerConfig)],
  providers: [MailerService],
  exports: [MailerService],
})
export class MailerModule {}
