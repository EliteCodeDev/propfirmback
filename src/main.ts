import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as bodyParser from 'body-parser';
// src/main.ts (al inicio del archivo)
import * as nodeCrypto from 'node:crypto';
(global as any).crypto ??= nodeCrypto; // asegura crypto.randomUUID()

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  //app.use(bodyParser.json({ limit: '500mb' }));
  //app.use(bodyParser.urlencoded({ limit: '500mb', extended: true }));
  // CORS mejorado: soporta múltiples orígenes separados por coma en CORS_ORIGIN
  // Ejemplo de variable:
  // CORS_ORIGIN=https://web.fundedhero.com,https://propfirm-front-client-turn.wuxenk.easypanel.host,https://otro-dominio.com
  const corsOriginEnv =
    configService.get<string>('CORS_ORIGIN') ||
    configService.get<string>('app.corsOrigin') ||
    '';

  const configuredOriginsRaw = corsOriginEnv
    .split(',')
    .map((o) => o.trim())
    .filter((o) => o.length > 0);

  type OriginRule = {
    raw: string;
    exact?: string; // valor normalizado
    regex?: RegExp; // si es comodín
  };

  const originRules: OriginRule[] = configuredOriginsRaw.map((entry) => {
    // Soporta comodines simples tipo: https://*.midominio.com
    if (entry.includes('*')) {
      // Escapa regex salvo el '*'
      const escaped = entry
        .replace(/\./g, '\\.')
        .replace(/\*/g, '.*')
        .replace(/\/$/, '');
      try {
        return {
          raw: entry,
          regex: new RegExp('^' + escaped + '$', 'i'),
        };
      } catch {
        return { raw: entry, exact: entry.replace(/\/$/, '') };
      }
    }
    return { raw: entry, exact: entry.replace(/\/$/, '') };
  });

  const defaultLocalOrigins = [
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'http://localhost:3001',
    'http://127.0.0.1:3001',
    'http://localhost:4002',
    'http://127.0.0.1:4002',
    'http://propfirm_n8n:5678',
  ];

  const allowedExact = Array.from(
    new Set(
      [
        ...originRules
          .filter((r) => r.exact)
          .map((r) => r.exact as string),
        ...defaultLocalOrigins.map((o) => o.replace(/\/$/, '')),
      ],
    ),
  );

  // Debug inicial
  console.log('[CORS] Exact origins:', allowedExact);
  console.log(
    '[CORS] Wildcard origins:',
    originRules.filter((r) => r.regex).map((r) => r.raw),
  );

  app.enableCors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true); // Server-to-server / curl sin Origin
      const normalized = origin.replace(/\/$/, '');
      // Exacto
      if (allowedExact.includes(normalized)) return callback(null, true);
      // Wildcards
      const matchedWildcard = originRules.some(
        (r) => r.regex && r.regex.test(normalized),
      );
      if (matchedWildcard) return callback(null, true);
      console.warn('[CORS] Bloqueado origin no permitido:', normalized);
      return callback(new Error(`CORS: Origin no permitido: ${origin}`), false);
    },
    credentials: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    allowedHeaders:
      'Authorization,Content-Type,Accept,cf-turnstile-response,X-Requested-With',
    exposedHeaders: 'Content-Disposition',
    maxAge: 600,
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
