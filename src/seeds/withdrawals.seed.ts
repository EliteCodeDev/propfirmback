import "reflect-metadata";
import * as nodeCrypto from 'crypto';

// Polyfill: expone globalThis.crypto.randomUUID si no existe
if (!(global as any).crypto?.randomUUID) {
  (global as any).crypto = { ...(global as any).crypto, randomUUID: nodeCrypto.randomUUID };
}
import { NestFactory } from "@nestjs/core";
import { AppModule } from "../app.module"; // ajusta si tu AppModule está en otro path
import { getRepositoryToken } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { faker } from "@faker-js/faker";

import { Withdrawal } from "../modules/withdrawals/entities/withdrawal.entity";
import { WithdrawalStatus } from "../common/enums/withdrawal-status.enum";
import { UserAccount } from "../modules/users/entities/user-account.entity";
// Si Challenge fuera obligatorio, podrías importar su entidad y asociar IDs

type StatusArg = WithdrawalStatus | "MIXED";

function parseArgs() {
  let count = 25;
  let status: StatusArg = "MIXED";
  let userId: string | undefined;
  let wipe = false;

  for (const raw of process.argv.slice(2)) {
    const arg = raw.replace(/^--/, "");
    const [k, v] = arg.includes("=") ? arg.split("=") : [arg, ""];
    if (k === "count" && v) count = Number(v);
    if (k === "status" && v && ["PENDING", "APPROVED", "REJECTED", "MIXED"].includes(v)) {
      status = v as StatusArg;
    }
    if (k === "userId" && v) userId = v;
    if (k === "wipe") wipe = true;
  }
  return { count, status, userId, wipe };
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
    const { count, status: statusArg, userId, wipe } = parseArgs();

    const withdrawalRepo = app.get<Repository<Withdrawal>>(getRepositoryToken(Withdrawal));
    const userRepo = app.get<Repository<UserAccount>>(getRepositoryToken(UserAccount));

    if (wipe) {
      await withdrawalRepo.delete({});
      console.log("🧹 Tabla Withdrawal limpiada.");
    }

    // Selección de usuarios base
    let users: UserAccount[] = [];
    if (userId) {
      const u = await userRepo.findOne({ where: { userID: userId } as any });
      if (!u) {
        console.error(`❌ userId no encontrado: ${userId}`);
        process.exit(1);
      }
      users = [u];
    } else {
      users = await userRepo.find({ take: 50 });
      if (!users.length) {
        console.error("❌ No hay usuarios. Crea al menos 1 usuario antes de seedear Withdrawals.");
        process.exit(1);
      }
    }

    const statuses = [WithdrawalStatus.PENDING, WithdrawalStatus.APPROVED, WithdrawalStatus.REJECTED];

    const items: Withdrawal[] = [];
    for (let i = 0; i < count; i++) {
      const user = users[i % users.length];

      const st =
        statusArg === "MIXED"
          ? faker.helpers.arrayElement(statuses)
          : (statusArg as WithdrawalStatus);

      const amount = Number(
        faker.finance.amount({ min: 25, max: 2500, dec: 2 })
      );

      const wallet = faker.string.alphanumeric({ length: 10, casing: "upper" });

      const observation =
        faker.helpers.maybe(() => faker.lorem.sentence(), { probability: 0.35 }) || null;

      const w = withdrawalRepo.create({
        userID: (user as any).userID, // ajusta si tu PK se llama distinto
        wallet,
        amount,
        observation,
        status: st,
        challengeID: null, // es nullable en tu entidad
      });

      items.push(w);
    }

    await withdrawalRepo.save(items);
    console.log(`✅ Insertados ${items.length} withdrawals de prueba.`);
  } catch (err) {
    console.error("❌ Error al seedear withdrawals:", err);
    process.exit(1);
  } finally {
    await app.close();
  }
}

bootstrap();
