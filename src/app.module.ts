// src/app.module.ts
import { Module } from '@nestjs/common';
import { APP_GUARD, APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';

import { validationSchema } from './config/validation.schema';
import mailerConfig from './config/mailer.config';
import { databaseConfig } from './config/database.config';
import { jwtConfig } from './config/jwt.config';
import { appConfig } from './config/app.config';

import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { TypeOrmExceptionFilter } from './common/filters/typeorm-exception.filter';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';

import { AuthModule } from './modules/auth/auth.module';
import { MailerModule } from './modules/mailer/mailer.module';
import { UsersModule } from './modules/users/users.module';
import { AffiliatesModule } from './modules/affiliates/affiliates.module';
import { ChallengesModule } from './modules/challenges/challenges.module';
import { BrokerAccountsModule } from './modules/broker-accounts/broker-accounts.module';
import { CertificatesModule } from './modules/certificates/certificates.module';
import { OrdersModule } from './modules/orders/orders.module';
import { VerificationModule } from './modules/verification/verification.module';
import { WithdrawalsModule } from './modules/withdrawals/withdrawals.module';
import { RbacModule } from './modules/rbac/rbac.module';
import { ChallengeTemplatesModule } from './modules/challenge-templates/challenge-templates.module';
import { ExternalCredentialsModule } from './modules/external-credentials/external-credentials.module';
import { SeedModule } from './modules/seed/seed.module';

import { AppController } from './app.controller';

import { ContextsModule } from './common/lib/buffer.module';

@Module({
  imports: [
    // config de entorno
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig],
      validationSchema,
      envFilePath: '.env',
      cache: true,
    }),
    // base de datos
    TypeOrmModule.forRootAsync(databaseConfig),
    // JWT
    JwtModule.registerAsync(jwtConfig),
    // rate limiting
    ThrottlerModule.forRoot({
      throttlers: [
        { ttl: 60000, limit: 100 }, // 60 000 ms = 1 min, hasta 100 peticiones
      ],
    }),
    // módulos de la aplicación

    ContextsModule,
    AuthModule,
    MailerModule,
    UsersModule,
    AffiliatesModule,
    ChallengeTemplatesModule,
    ChallengesModule,
    BrokerAccountsModule,
    CertificatesModule,
    OrdersModule,
    VerificationModule,
    WithdrawalsModule,
    RbacModule,
    ExternalCredentialsModule,
  SeedModule,
  ],
  controllers: [
    AppController, // GET /api → health-check
  ],
  providers: [
    // guards globales
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    // filtros globales
    { provide: APP_FILTER, useClass: HttpExceptionFilter },
    { provide: APP_FILTER, useClass: TypeOrmExceptionFilter },
    // interceptores globales
    { provide: APP_INTERCEPTOR, useClass: LoggingInterceptor },
    { provide: APP_INTERCEPTOR, useClass: ResponseInterceptor },
  ],
})
export class AppModule {}
