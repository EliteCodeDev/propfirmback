// src/app.module.ts
import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { APP_GUARD, APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { WinstonModule } from 'nest-winston';

import { TurnstileService } from './common/security/turnstile.service';
import { CustomLoggerService } from './common/services/custom-logger.service';

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
  loggerConfig,
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
  BusinessRequirementModule,
  BrokeretApiModule,
  StorageModule,
  MinioModule,
  StylesModule,
} from 'src/modules';
import { DashboardModule } from './modules/dashboard/dashboard.module';
// Seed on boot support
import { SeedOnBootModule } from './seeds/seed-on-boot.module';
import { TasksModule } from './tasks/tasks.module';
import { BufferModule } from './lib/buffer/buffer.module';

// Flag para deshabilitar tareas/cron por entorno
const disableTasks =
  String(process.env.DISABLE_TASKS || '').toLowerCase() === 'true';

@Module({
  imports: [
    // config global
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
    ConfigModule.forFeature(apiKeysConfig),
    ConfigModule.forFeature(loggerConfig),
    // Winston Logger
    WinstonModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => configService.get('logger'),
      inject: [ConfigService],
    }),
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
    // Schedule/Tasks condicionales por entorno
    ...(!disableTasks ? [ScheduleModule.forRoot()] : []),
    // Application modules
    BusinessRequirementModule,
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
    BrokeretApiModule,
    DashboardModule,
    SeedOnBootModule,
    ...(!disableTasks ? [TasksModule] : []),
    StylesModule,
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
    CustomLoggerService,
  ],
})
export class AppModule {}
