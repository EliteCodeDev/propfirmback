/* eslint-disable no-console */
import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { DataSource } from 'typeorm';

// Entities
import { UserAccount } from '../modules/users/entities/user-account.entity';
import { Challenge } from '../modules/challenges/entities/challenge.entity';
import { ChallengeRelation } from '../modules/challenge-templates/entities/challenge-relation.entity';
import { RelationBalance } from '../modules/challenge-templates/entities/balance/relation-balance.entity';
import { ChallengeBalance } from '../modules/challenge-templates/entities/balance/challenge-balance.entity';
import { ChallengeStatus } from '../common/enums/challenge-status.enum';

// tiny deterministic hash so the assignment looks random but is idempotent
function hashString(input: string): number {
  let h = 5381;
  for (let i = 0; i < input.length; i++) {
    h = ((h << 5) + h) + input.charCodeAt(i); // h * 33 + char
    h |= 0; // force int32
  }
  return Math.abs(h);
}

async function getAllUsers(ds: DataSource): Promise<UserAccount[]> {
  const userRepo = ds.getRepository(UserAccount);
  // Use a stable order so the hash → index mapping is consistent across runs
  return await userRepo.find({ order: { createdAt: 'ASC' as any } });
}

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn', 'log'],
  });

  try {
    const ds = app.get(DataSource);
  const challengeRepo = ds.getRepository(Challenge);
    const relationRepo = ds.getRepository(ChallengeRelation);
    const relationBalanceRepo = ds.getRepository(RelationBalance);
    const balanceRepo = ds.getRepository(ChallengeBalance);

    const users = await getAllUsers(ds);
    if (!users.length) {
      console.log('⚠️ No hay usuarios. Ejecuta primero: npm run seed:users');
      return;
    }

  // Ensure we have relations from the challenge-templates seeder
  const relations = await relationRepo.find();
    if (relations.length === 0) {
      console.log('⚠️ No hay challenge templates. Ejecuta primero: npm run seed:challenge-templates');
      return;
    }

    // For each relation, create one challenge per available balance, assigned to a pseudo-random user
    let created = 0;
    let relationsWithoutRB = 0;
    for (const rel of relations) {
      const relBalances = await relationBalanceRepo.find({ where: { relationID: rel.relationID } });
      if (relBalances.length === 0) {
        relationsWithoutRB++;
        // Fallback: if relation has a direct balanceID, create one challenge from it
        if (rel.balanceID) {
          const bal = await balanceRepo.findOne({ where: { balanceID: rel.balanceID } });
          const dynamicBalance = bal?.balance ?? null;

          const key = `${rel.relationID}:${rel.balanceID}`;
          const idx = hashString(key) % users.length;
          const assignedUser = users[idx];

          const exists = await challengeRepo.findOne({
            where: {
              userID: assignedUser.userID,
              relationID: rel.relationID,
              dynamicBalance: dynamicBalance as any,
            },
          });
          if (!exists) {
            const entity = challengeRepo.create({
              userID: assignedUser.userID,
              relationID: rel.relationID,
              startDate: null,
              endDate: null,
              numPhase: 1,
              dynamicBalance: dynamicBalance ?? undefined,
              status: ChallengeStatus.INNITIAL,
              isActive: true,
              parentID: null,
              brokerAccountID: null,
            });
            await challengeRepo.save(entity);
            created++;
          }
        }
        continue;
      }

      for (const rb of relBalances) {
        const bal = await balanceRepo.findOne({ where: { balanceID: rb.balanceID } });
        const dynamicBalance = bal?.balance ?? null;

        // Choose a pseudo-random but deterministic user for this (relation + balance)
        const key = `${rel.relationID}:${rb.balanceID}`;
        const idx = hashString(key) % users.length;
        const assignedUser = users[idx];

        // Idempotent: if a challenge already exists for same assigned user + relation + balance, skip
        const existing = await challengeRepo.findOne({
          where: {
            userID: assignedUser.userID,
            relationID: rel.relationID,
            dynamicBalance: dynamicBalance as any,
          },
        });
        if (existing) continue;

        const entity = challengeRepo.create({
          userID: assignedUser.userID,
          relationID: rel.relationID,
          startDate: null,
          endDate: null,
          numPhase: 1,
          dynamicBalance: dynamicBalance ?? undefined,
          status: ChallengeStatus.INNITIAL,
          isActive: true,
          parentID: null,
          brokerAccountID: null,
        });
        await challengeRepo.save(entity);
        created++;
      }
    }

    console.log(`🎉 Seed de challenges (reales) completado: ${created} creados y asignados a usuarios al azar (determinístico).`);
    if (relationsWithoutRB > 0) {
      console.log(`ℹ️ ${relationsWithoutRB} relaciones no tenían RelationBalance. Se usó el balanceID directo si estaba presente.`);
    }
  } catch (err) {
    console.error('❌ Error durante el seed de challenges (reales):', err);
    process.exitCode = 1;
  } finally {
    await app.close();
  }
}

bootstrap();
