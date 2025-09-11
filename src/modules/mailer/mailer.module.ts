import { Module, forwardRef } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MailerService } from './mailer.service';
import { mailerConfig } from '../../config';
import { MailerController } from './mailer.controller';
import { StylesModule } from '../styles/styles.module';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    ConfigModule.forFeature(mailerConfig),
    StylesModule,
    forwardRef(() => UsersModule),
  ],
  providers: [MailerService],
  exports: [MailerService],
  controllers: [MailerController],
})
export class MailerModule {}
