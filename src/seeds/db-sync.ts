/* eslint-disable no-console */
import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn', 'log'],
  });
  try {
    // Initializing the AppModule is enough for TypeORM to apply
    // dropSchema/synchronize based on env flags.
    console.log('✔ Database sync executed according to current env flags.');
  } catch (err) {
    console.error('❌ Error during db sync:', err);
    process.exitCode = 1;
  } finally {
    await app.close();
  }
}

bootstrap();
