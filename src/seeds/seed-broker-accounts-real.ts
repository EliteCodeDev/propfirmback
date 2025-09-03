/* eslint-disable no-console */
import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { DataSource, IsNull } from 'typeorm';
import { BrokerAccount } from '../modules/broker-accounts/entities/broker-account.entity';
import { Challenge } from '../modules/challenges/entities/challenge.entity';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn', 'log'],
  });

  try {
    const ds = app.get(DataSource);
    const repo = ds.getRepository(BrokerAccount);

    let created = 0;
    let updated = 0;

    // Generamos 30 cuentas realistas y determinísticas (idempotente por login único)
    // MT5 por defecto; puedes ajustar servidor/ip según tu entorno
    const total = 30;
    for (let i = 1; i <= total; i++) {
      const idx = String(i).padStart(4, '0');
      const login = `MT5_${1000 + i}`; // e.g., MT5_1001 ... MT5_1030

      // Campos base
      const data: Partial<BrokerAccount> = {
        login,
        password: `Pass${idx}!`,
        investorPass: `Inv${idx}!`,
        platform: 'MT5',
        server: 'MetaQuotes-Demo',
        serverIp: '127.0.0.1',
        isUsed: false,
        innitialBalance: 10000 + i * 1000, // 11k .. 40k
      };

      const existing = await repo.findOne({ where: { login } });
      if (!existing) {
        const entity = repo.create(data as BrokerAccount);
        await repo.save(entity);
        created++;
      } else {
        // Mantener idempotencia actualizando datos por si cambian
        existing.password = data.password ?? existing.password;
        existing.investorPass = data.investorPass ?? existing.investorPass;
        existing.platform = data.platform ?? existing.platform;
        existing.server = data.server ?? existing.server;
        existing.serverIp = data.serverIp ?? existing.serverIp;
        existing.isUsed = existing.isUsed ?? false; // no forzamos a false si ya fue usado
        existing.innitialBalance = data.innitialBalance ?? existing.innitialBalance;
        await repo.save(existing);
        updated++;
      }
    }

    // Asignar cuentas disponibles a challenges sin broker asignado (idempotente)
    const challengeRepo = ds.getRepository(Challenge);

    const challengesWithoutBroker = await challengeRepo.find({
      where: { brokerAccountID: IsNull() },
      order: { challengeID: 'ASC' as any },
    });

    const availableAccounts = await repo.find({
      where: { isUsed: false },
      order: { login: 'ASC' as any },
    });

    const toAssign = Math.min(challengesWithoutBroker.length, availableAccounts.length);
    let assigned = 0;

    for (let i = 0; i < toAssign; i++) {
      const ch = challengesWithoutBroker[i];
      const acc = availableAccounts[i];

      // Asignar y marcar como usada
      ch.brokerAccountID = acc.brokerAccountID;
      acc.isUsed = true;

      await challengeRepo.save(ch);
      await repo.save(acc);
      assigned++;

      console.log(`🔗 Asignado brokerAccount login=${acc.login} → challengeID=${ch.challengeID}`);
    }

    console.log(`🎉 Seed de broker accounts (reales) completado: ${created} creadas, ${updated} actualizadas.`);
    console.log(`🔢 Asignaciones realizadas: ${assigned} (challenges sin broker: ${challengesWithoutBroker.length}, cuentas disponibles: ${availableAccounts.length}).`);
  } catch (err) {
    console.error('❌ Error durante el seed de broker accounts (reales):', err);
    process.exitCode = 1;
  } finally {
    await app.close();
  }
}

bootstrap();