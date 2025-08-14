/* eslint-disable no-console */
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { DataSource } from 'typeorm';
import { faker } from '@faker-js/faker';
import { Challenge } from '../modules/challenges/entities/challenge.entity';
import { UserAccount } from '../modules/users/entities/user-account.entity';
import { ChallengeStatus } from '../common/enums/challenge-status.enum';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn', 'log'],
  });

  try {
    const ds = app.get(DataSource);
    const userRepo = ds.getRepository(UserAccount);
    const challengeRepo = ds.getRepository(Challenge);

    // Obtener hasta 30 usuarios (los seeded), filtrando admin/demo si se desea incluirlos o no
    const users = await userRepo.find({ take: 30, order: { createdAt: 'ASC' as any } });
    if (users.length === 0) {
      console.log('⚠️ No hay usuarios para asignar challenges. Ejecuta primero el seed de usuarios.');
      return;
    }

    const statuses = Object.values(ChallengeStatus);

    const toCreate: Partial<Challenge>[] = [];
    for (let i = 0; i < 100; i++) {
      const randomUser = users[Math.floor(Math.random() * users.length)];
      const start = faker.date.past({ years: 1 });
      const end = faker.date.future({ years: 1, refDate: start });
      const status = statuses[Math.floor(Math.random() * statuses.length)] as ChallengeStatus;

      toCreate.push({
        userID: randomUser.userID,
        relationID: null,
        startDate: start,
        endDate: end,
        numPhase: faker.number.int({ min: 1, max: 3 }),
        dynamicBalance: Number(faker.finance.amount({ min: 1000, max: 100000, dec: 2 })),
        status,
        isActive: true,
        parentID: null,
        brokerAccountID: null,
      });
    }

    const entities = toCreate.map((p) => challengeRepo.create(p));
    await challengeRepo.save(entities);

    console.log(`🎉 Seed de challenges completado: ${entities.length} creados.`);
  } catch (err) {
    console.error('❌ Error durante el seed de challenges:', err);
    process.exitCode = 1;
  } finally {
    await app.close();
  }
}

bootstrap();
