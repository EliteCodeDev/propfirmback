import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleAsyncOptions } from '@nestjs/typeorm';

export const databaseConfig: TypeOrmModuleAsyncOptions = {
  inject: [ConfigService],
  useFactory: (configService: ConfigService) => ({
    type: 'postgres',
    host: configService.get('DATABASE_HOST'),
    port: configService.get('DATABASE_PORT'),
    username: configService.get('DATABASE_USERNAME'),
    password: configService.get('DATABASE_PASSWORD'),
    database: configService.get('DATABASE_NAME'),
    ssl:
      configService.get('DATABASE_SSL') === 'true'
        ? {
            rejectUnauthorized: false,
          }
        : false,
    // Buscar entidades solo dentro de carpetas "entities" (incluyendo subcarpetas)
    entities: [__dirname + '/../**/entities/**/*.entity{.ts,.js}'],
    migrations: [__dirname + '/../database/migrations/*{.ts,.js}'],
    synchronize: configService.get('NODE_ENV') === 'development',
    logging:
      configService.get('NODE_ENV') === 'development'
        ? ['query', 'error']
        : ['error'],
    migrationsRun: false,
    autoLoadEntities: true,
    retryAttempts: 3,
    retryDelay: 3000,
    dropSchema: true,
  }),
};
