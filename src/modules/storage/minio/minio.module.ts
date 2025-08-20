import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { NestMinioModule } from 'nestjs-minio';
import { ConfigService } from '@nestjs/config';
import { MinioService } from './minio.service';
import { MinioController } from './minio.controller';
import { minioConfig } from 'src/config';

@Module({
  imports: [
    ConfigModule.forFeature(minioConfig),
    NestMinioModule.registerAsync({
      imports: [ConfigModule.forFeature(minioConfig)],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        isGlobal: true,
        endPoint: configService.get('minio.endPoint'),
        port: configService.get('minio.port'),
        useSSL: configService.get('minio.useSSL'),
        accessKey: configService.get('minio.accessKey'),
        secretKey: configService.get('minio.secretKey'),
      }),
    }),
  ],
  controllers: [MinioController],
  providers: [MinioService],
  exports: [MinioService],
})
export class MinioModule {}
