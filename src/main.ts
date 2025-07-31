import { NestFactory }        from '@nestjs/core';
import { AppModule }           from './app.module';
import { ConfigService }       from '@nestjs/config';
import { ValidationPipe }      from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  // CORS
  app.enableCors({
    origin: [
      configService.get<string>('CORS_ORIGIN'),
      'http://localhost:3000',
      'http://127.0.0.1:3000',
    ],
    credentials: true,
  });

  // Validation Pipe
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
    transformOptions: { enableImplicitConversion: true },
  }));

  // Prefijo global
  app.setGlobalPrefix('api');

  // Swagger
  const swaggerConfig = new DocumentBuilder()
    .setTitle('PropFirm API')
    .setDescription('API para la plataforma PropFirm')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document);

  const host = configService.get<string>('HOST');
  const port = configService.get<number>('PORT');
  await app.listen(port, host);

  console.log(`🚀 PropFirm Backend running on: http://${host}:${port}/api`);
  console.log(`📚 API Docs: http://${host}:${port}/api/docs`);
}

bootstrap();
