import "reflect-metadata";
// Deshabilitar jobs/cron durante seeding para evitar conflictos de conexión
process.env.SEEDING = process.env.SEEDING || 'true';
process.env.DISABLE_TASKS = process.env.DISABLE_TASKS || 'true';
process.env.DISABLE_JOBS = process.env.DISABLE_JOBS || 'true';
process.env.DISABLE_BUFFER_JOBS = process.env.DISABLE_BUFFER_JOBS || 'true';

import * as nodeCrypto from 'crypto';

// Polyfill: expone globalThis.crypto.randomUUID si no existe
if (!(global as any).crypto?.randomUUID) {
  (global as any).crypto = { ...(global as any).crypto, randomUUID: nodeCrypto.randomUUID };
}
import { NestFactory } from "@nestjs/core";
import { AppModule } from "../app.module"; // ajusta si tu AppModule está en otro path
import { getRepositoryToken } from "@nestjs/typeorm";
import { In, Repository } from "typeorm";
import { faker } from "@faker-js/faker";

import { Withdrawal } from "../modules/withdrawals/entities/withdrawal.entity";
import { WithdrawalStatus } from "../common/enums/withdrawal-status.enum";
import { UserAccount } from "../modules/users/entities/user-account.entity";
import { Challenge } from "../modules/challenges/entities/challenge.entity";
// Si Challenge fuera obligatorio, podrías importar su entidad y asociar IDs

type StatusArg = WithdrawalStatus | "MIXED";

function parseArgs() {
  let count = 25;
  let status: StatusArg = "MIXED";
  let userId: string | undefined;
  let wipe = false;
  let requireChallenge = false; // por defecto compatible; el orquestador lo activará

  for (const raw of process.argv.slice(2)) {
    const arg = raw.replace(/^--/, "");
    const [k, v] = arg.includes("=") ? arg.split("=") : [arg, ""];
    if (k === "count" && v) count = Number(v);
    if (k === "status" && v && ["PENDING", "APPROVED", "REJECTED", "MIXED"].includes(v)) {
      status = v as StatusArg;
    }
    if (k === "userId" && v) userId = v;
    if (k === "wipe") wipe = true;
    if (k === "requireChallenge") requireChallenge = v === "" || v.toLowerCase() === "true";
  }
  return { count, status, userId, wipe, requireChallenge };
}

async function bootstrap() {
  if (process.env.NODE_ENV === "production") {
    console.error("❌ Abortado: no seedeo en producción.");
    process.exit(1);
  }

  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ["error", "warn", "log"],
  });

  try {
    const { count, status: statusArg, userId, wipe, requireChallenge } = parseArgs();

    const withdrawalRepo = app.get<Repository<Withdrawal>>(getRepositoryToken(Withdrawal));
    const userRepo = app.get<Repository<UserAccount>>(getRepositoryToken(UserAccount));
    const challengeRepo = app.get<Repository<Challenge>>(getRepositoryToken(Challenge));

    if (wipe) {
      await withdrawalRepo.clear();
      console.log("🧹 Tabla Withdrawal limpiada.");
    }

    // Cargar usuarios base
    let users: UserAccount[] = [];
    if (userId) {
      const u = await userRepo.findOne({ where: { userID: userId } as any });
      if (!u) {
        console.error(`❌ userId no encontrado: ${userId}`);
        process.exit(1);
      }
      users = [u];
    } else {
      users = await userRepo.find({ take: 200 });
      if (!users.length) {
        console.error("❌ No hay usuarios. Crea al menos 1 usuario antes de seedear Withdrawals.");
        process.exit(1);
      }
    }

    // Pre-cargar challenges por usuario
    const userIds = users.map((u: any) => u.userID);
    const challenges = await challengeRepo.find({ where: { userID: In(userIds) } as any });
    const challengesByUser = new Map<string, Challenge[]>();
    for (const ch of challenges) {
      const key = (ch as any).userID;
      const arr = challengesByUser.get(key) || [];
      arr.push(ch);
      challengesByUser.set(key, arr);
    }

    const statuses = [WithdrawalStatus.PENDING, WithdrawalStatus.APPROVED, WithdrawalStatus.REJECTED];

    const items: Withdrawal[] = [];

    if (requireChallenge) {
      if (challenges.length === 0) {
        console.error("❌ --requireChallenge activo pero no hay challenges para asociar.");
        process.exit(1);
      }
      for (let i = 0; i < count; i++) {
        const st =
          statusArg === "MIXED"
            ? faker.helpers.arrayElement(statuses)
            : (statusArg as WithdrawalStatus);

        const amount = Number(faker.finance.amount({ min: 25, max: 2500, dec: 2 }));
        const wallet = faker.string.alphanumeric({ length: 10, casing: "upper" });
        const observation = faker.helpers.maybe(() => faker.lorem.sentence(), { probability: 0.35 }) || null;

        // Seleccionar SIEMPRE un challenge existente y usar su userID
        const pick = faker.helpers.arrayElement(challenges);

        const w = withdrawalRepo.create({
          userID: (pick as any).userID,
          wallet,
          amount,
          observation,
          status: st,
          challengeID: (pick as any).challengeID,
        });
        items.push(w);
      }
    } else {
      for (let i = 0; i < count; i++) {
        const user = users[i % users.length];

        const st =
          statusArg === "MIXED"
            ? faker.helpers.arrayElement(statuses)
            : (statusArg as WithdrawalStatus);

        const amount = Number(faker.finance.amount({ min: 25, max: 2500, dec: 2 }));
        const wallet = faker.string.alphanumeric({ length: 10, casing: "upper" });
        const observation = faker.helpers.maybe(() => faker.lorem.sentence(), { probability: 0.35 }) || null;

        const userChallenges = challengesByUser.get((user as any).userID) || [];
        const pick = userChallenges.length ? faker.helpers.arrayElement(userChallenges) : null;

        const w = withdrawalRepo.create({
          userID: (user as any).userID,
          wallet,
          amount,
          observation,
          status: st,
          challengeID: pick ? (pick as any).challengeID : null,
        });
        items.push(w);
      }
    }

    await withdrawalRepo.save(items);
    const associated = items.filter((w) => (w as any).challengeID).length;
    console.log(
      `✅ Insertados ${items.length} withdrawals de prueba. Asociados a challenge: ${associated}/${items.length}. Challenges detectados: ${challenges.length}`
    );
  } catch (err) {
    console.error("❌ Error al seedear withdrawals:", err);
    process.exit(1);
  } finally {
    await app.close();
  }
}

bootstrap();
