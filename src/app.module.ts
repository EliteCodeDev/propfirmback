// src/app.module.ts
import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { APP_GUARD, APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { TurnstileService } from './common/security/turnstile.service';

import {
  validationSchema,
  databaseConfig,
  jwtConfig,
  appConfig,
  jwtConfigValues,
  mailerConfig,
  smtApiConfig,
  brokeretApiConfig,
  apiKeysConfig,
  minioConfig,
} from './config';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { TypeOrmExceptionFilter } from './common/filters/typeorm-exception.filter';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';

import {
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
  SmtApiModule,
  // BrokeretApiModule,
  StorageModule,
  MinioModule,
  N8nModule,
} from 'src/modules';
// Seed on boot support
import { SeedOnBootModule } from './seeds/seed-on-boot.module';
import { TasksModule } from './tasks/tasks.module';
import { BufferModule } from './lib/buffer/buffer.module';

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
    // cargar namespaces de config
    ConfigModule.forFeature(appConfig),
    ConfigModule.forFeature(jwtConfigValues),
    ConfigModule.forFeature(mailerConfig),
    ConfigModule.forFeature(smtApiConfig),
    ConfigModule.forFeature(brokeretApiConfig),
    ConfigModule.forFeature(apiKeysConfig),
    ConfigModule.forFeature(minioConfig),
    // base de datos
    TypeOrmModule.forRootAsync(databaseConfig),
    // JWT
    JwtModule.registerAsync(jwtConfig),
    // rate limiting
    ThrottlerModule.forRoot({
      throttlers: [
        { ttl: 60000, limit: 100 }, // configurar mediante appConfig si se desea
      ],
    }),
    ScheduleModule.forRoot(),
    // Application modules
    BufferModule,
    StorageModule,
    MinioModule,
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
    SmtApiModule,
    // BrokeretApiModule,
    SeedOnBootModule,
    TasksModule,
    N8nModule,
  ],
  controllers: [
    //aea
  ],
  providers: [
    // guards globales
    // { provide: APP_GUARD, useClass: HybridAuthGuard },
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    // filtros globales
    { provide: APP_FILTER, useClass: HttpExceptionFilter },
    { provide: APP_FILTER, useClass: TypeOrmExceptionFilter },
    // interceptores globales
    { provide: APP_INTERCEPTOR, useClass: LoggingInterceptor },
    { provide: APP_INTERCEPTOR, useClass: ResponseInterceptor },
    TurnstileService,
  ],
})
export class AppModule {}
