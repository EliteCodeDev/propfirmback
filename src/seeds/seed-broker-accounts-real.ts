/* eslint-disable no-console */
import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { DataSource } from 'typeorm';

import { BrokerAccount } from '../modules/broker-accounts/entities/broker-account.entity';
import { Challenge } from '../modules/challenges/entities/challenge.entity';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn', 'log'],
  });

  try {
    const ds = app.get(DataSource);
    const brokerRepo = ds.getRepository(BrokerAccount);
    const challengeRepo = ds.getRepository(Challenge);

    // We will create a simple, deterministic broker account per challenge lacking one
    const challenges = await challengeRepo.find();
    if (challenges.length === 0) {
      console.log('⚠️ No hay challenges. Ejecuta primero el seed de challenges reales.');
      return;
    }

    let created = 0;
    for (const ch of challenges) {
      if (ch.brokerAccountID) continue;

      // Deterministic login based on challengeID to avoid collisions and allow idempotency
      const login = `ACC-${ch.challengeID.substring(0, 8).toUpperCase()}`;

      // Check if an account with this login exists already
      let account = await brokerRepo.findOne({ where: { login } });
      if (!account) {
        account = brokerRepo.create({
          login,
          password: `P-${ch.challengeID.substring(9, 17)}`,
          server: 'MT5-Live',
          serverIp: '127.0.0.1',
          platform: 'MT5',
          isUsed: true,
          investorPass: 'INVESTOR',
          innitialBalance: ch.dynamicBalance ?? 0,
        });
        await brokerRepo.save(account);
        created++;
      }

      // Link to challenge if not already linked
      if (!ch.brokerAccountID) {
        ch.brokerAccountID = account.brokerAccountID;
        await challengeRepo.save(ch);
      }
    }

    console.log(`🎉 Seed de broker accounts (reales) completado: ${created} cuentas creadas.`);
  } catch (err) {
    console.error('❌ Error durante el seed de broker accounts (reales):', err);
    process.exitCode = 1;
  } finally {
    await app.close();
  }
}

bootstrap();
