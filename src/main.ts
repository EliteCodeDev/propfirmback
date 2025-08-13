import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
// Node 20 ya expone globalThis.crypto (WebCrypto). El intento previo de sobrescribirlo causa error
// TypeError: Cannot set property crypto of #<Object> which has only a getter.
// Si algún paquete espera WebCrypto y el runtime no lo tuviera (Node <15), se podría usar:
//   (globalThis as any).crypto = require('crypto').webcrypto;
// Aquí simplemente validamos y NO reasignamos para evitar el error.
import { webcrypto as _webcrypto } from 'crypto';
if (!(globalThis as any).crypto) {
  (globalThis as any).crypto = _webcrypto; // fallback sólo si no existe
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  // CORS
  app.enableCors({
    origin: [
      configService.get<string>('app.corsOrigin') ||
        configService.get<string>('CORS_ORIGIN'),
      'http://localhost:3000',
      'http://127.0.0.1:3000',
    ],
    credentials: true,
  });

  // Validation Pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // Global prefix
  app.setGlobalPrefix(configService.get<string>('app.apiPrefix') || 'api');

  // Swagger
  const swaggerConfig = new DocumentBuilder()
    .setTitle('PropFirm API')
    .setDescription('API for the PropFirm platform')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup(
    configService.get<string>('app.swaggerPath') || 'api/docs',
    app,
    document,
  );

  const host =
    configService.get<string>('app.host') || configService.get<string>('HOST');
  const port =
    configService.get<number>('app.port') || configService.get<number>('PORT');
  await app.listen(port, host);

  console.log(`🚀 PropFirm Backend running on: http://${host}:${port}/api`);
  console.log(`📚 API Docs: http://${host}:${port}/api/docs`);
}

bootstrap();
