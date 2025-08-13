import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule } from '@nestjs/config';

import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { LocalStrategy } from './strategies/local.strategy';
import { JwtStrategy } from './strategies/jwt.strategy';
import { UserAccount } from '../users/entities/user-account.entity';
import { Role } from '../rbac/entities/role.entity';
import { MailerModule } from '../mailer/mailer.module';
import { jwtConfig } from '../../config';
import { PasswordResetModule } from '../password-reset/password-reset.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([UserAccount, Role]),
    ConfigModule,
    JwtModule.registerAsync(jwtConfig),
    MailerModule,
    PasswordResetModule,
  ],
  providers: [AuthService, LocalStrategy, JwtStrategy],
  controllers: [AuthController],
})
export class AuthModule {}
