/* eslint-disable no-console */
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { DataSource } from 'typeorm';
import { faker } from '@faker-js/faker';
import { BrokerAccount } from '../modules/broker-accounts/entities/broker-account.entity';
import { Challenge } from '../modules/challenges/entities/challenge.entity';

function parseArgs() {
  let wipe = false; // --wipe: limpiar y regenerar para todos los challenges
  for (const raw of process.argv.slice(2)) {
    const arg = raw.replace(/^--/, '');
    if (arg === 'wipe') wipe = true;
  }
  return { wipe };
}

async function uniqueLogin(ds: DataSource, used: Set<string>): Promise<string> {
  const repo = ds.getRepository(BrokerAccount);
  for (let i = 0; i < 20; i++) {
    // Ej: BA-12345678
    const candidate = `BA-${faker.number.int({ min: 10_000_000, max: 99_999_999 })}`;
    if (used.has(candidate)) continue;
    const exists = await repo.findOne({ where: { login: candidate } });
    if (!exists) {
      used.add(candidate);
      return candidate;
    }
  }
  // fallback muy poco probable
  const fallback = `BA-${Date.now()}-${faker.number.int({ min: 100, max: 999 })}`;
  used.add(fallback);
  return fallback;
}

async function bootstrap() {
  const { wipe } = parseArgs();
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn', 'log'],
  });

  try {
    const ds = app.get(DataSource);
    const brokerRepo = ds.getRepository(BrokerAccount);
    const challengeRepo = ds.getRepository(Challenge);

    if (wipe) {
      // Desvincular challenges y limpiar broker accounts
      await challengeRepo
        .createQueryBuilder()
        .update(Challenge)
        .set({ brokerAccountID: null })
        .where('brokerAccountID IS NOT NULL')
        .execute();

      await brokerRepo.delete({});
      console.log('🧹 Tabla BrokerAccount limpiada y challenges desvinculados.');
    }

    // Obtener challenges; si no hay, avisar
  const challenges = await challengeRepo.find();
    if (!challenges.length) {
      console.log('⚠️ No hay challenges. Ejecuta primero el seed de challenges.');
      return;
    }

    // Crear un broker account por challenge que no tenga uno asignado
    const usedLogins = new Set<string>();
    let createdCount = 0;
    let skipped = 0;

    for (const ch of challenges) {
      if (!wipe && ch.brokerAccountID) {
        skipped++;
        continue;
      }

      const platform = faker.helpers.arrayElement(['MT4', 'MT5', 'cTrader']);
      const login = await uniqueLogin(ds, usedLogins);
      const innitialBalance = Number(
        faker.finance.amount({ min: 5_000, max: 100_000, dec: 2 })
      );

      const acc = brokerRepo.create({
        login,
        password: faker.internet.password({ length: 12 }),
        server: `${platform}-${faker.internet.domainWord()}`,
        serverIp: faker.internet.ipv4(),
        platform,
        isUsed: true,
        investorPass: faker.internet.password({ length: 10 }),
        innitialBalance,
      });
      const saved = await brokerRepo.save(acc);

      // Vincular al challenge
      ch.brokerAccountID = saved.brokerAccountID;
      await challengeRepo.save(ch);
      createdCount++;
    }

    console.log(`🎉 Seed de broker accounts completado: ${createdCount} creados. (${skipped} omitidos)`);
  } catch (err) {
    console.error('❌ Error durante el seed de broker accounts:', err);
    process.exitCode = 1;
  } finally {
    await app.close();
  }
}

bootstrap();
