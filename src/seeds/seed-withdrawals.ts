/* eslint-disable no-console */
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { DataSource, DeepPartial } from 'typeorm';
import { faker } from '@faker-js/faker';

import { Withdrawal } from '../modules/withdrawals/entities/withdrawal.entity';
import { UserAccount } from '../modules/users/entities/user-account.entity';
import { Challenge } from '../modules/challenges/entities/challenge.entity';
import { WithdrawalStatus } from '../common/enums/withdrawal-status.enum';
import { ChallengeStatus } from '../common/enums/challenge-status.enum';

async function ensureWithdrawal(
  ds: DataSource,
  params: {
    userID: string;
    wallet: string;
    amount: number;
    observation?: string;
    status: WithdrawalStatus;
    challengeID?: string;
    createdAt?: Date;
  }
) {
  const withdrawalRepo = ds.getRepository(Withdrawal);

  const payload: DeepPartial<Withdrawal> = {
    userID: params.userID,
    wallet: params.wallet,
    amount: params.amount,
    observation: params.observation || null,
    status: params.status,
    challengeID: params.challengeID || null,
    createdAt: params.createdAt || new Date(),
  };

  const withdrawal = withdrawalRepo.create(payload);
  await withdrawalRepo.save(withdrawal);
  console.log(`✅ Withdrawal creado: $${params.amount} para usuario ${params.userID}`);

  return withdrawal;
}

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn', 'log'],
  });

  try {
    const ds = app.get(DataSource);
    const userRepo = ds.getRepository(UserAccount);
    const challengeRepo = ds.getRepository(Challenge);

    // Obtener usuarios y challenges
    const users = await userRepo.find({ take: 30, order: { createdAt: 'ASC' as any } });
    const challenges = await challengeRepo.find({
      where: { status: ChallengeStatus.WITHDRAWABLE },
      take: 20,
    });

    if (users.length === 0) {
      console.log('⚠️ No hay usuarios para crear withdrawals. Ejecuta primero el seed de usuarios.');
      return;
    }

    // Wallets realistas (crypto y tradicionales)
    const cryptoWallets = [
      '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa', // Bitcoin
      '0x742d35Cc6634C0532925a3b8D4C2C4e4C4C4C4C4', // Ethereum
      'TQn9Y2khEsLJW1ChVWFMSMeRDow5oREqjK', // TRON
      'bnb1grpf0955h0ykzq3ar5nmum7y6gdfl6lxfn46h2', // Binance
      'addr1qxy2lpan99fcnhhyknstnn9ej8qlmaplwqzwx2hr3d429dkwetfknxc72gdnmfhreud', // Cardano
    ];

    const bankAccounts = [
      'ES91 2100 0418 4502 0005 1332', // IBAN España
      'GB29 NWBK 6016 1331 9268 19', // IBAN Reino Unido
      'DE89 3704 0044 0532 0130 00', // IBAN Alemania
      'FR14 2004 1010 0505 0001 3M02 606', // IBAN Francia
      'IT60 X054 2811 1010 0000 0123 456', // IBAN Italia
    ];

    const paypalEmails = [
      'trader.payments@gmail.com',
      'forex.profits@outlook.com',
      'trading.withdrawals@yahoo.com',
      'prop.firm.trader@hotmail.com',
      'elite.trader.2024@gmail.com',
    ];

    // Crear withdrawals con diferentes estados y montos realistas
    const withdrawalData = [
      // Withdrawals aprobados y pagados (exitosos)
      ...Array.from({ length: 15 }, (_, i) => ({
        amount: faker.number.float({ min: 500, max: 15000, fractionDigits: 2 }),
        status: WithdrawalStatus.PAID,
        observation: 'Withdrawal processed successfully',
        createdAt: faker.date.past({ years: 1 }),
      })),
      
      // Withdrawals pendientes
      ...Array.from({ length: 8 }, (_, i) => ({
        amount: faker.number.float({ min: 1000, max: 25000, fractionDigits: 2 }),
        status: WithdrawalStatus.PENDING,
        observation: 'Pending review and approval',
        createdAt: faker.date.recent({ days: 30 }),
      })),
      
      // Withdrawals aprobados pero no pagados
      ...Array.from({ length: 5 }, (_, i) => ({
        amount: faker.number.float({ min: 2000, max: 20000, fractionDigits: 2 }),
        status: WithdrawalStatus.APPROVED,
        observation: 'Approved, processing payment',
        createdAt: faker.date.recent({ days: 7 }),
      })),
      
      // Withdrawals rechazados
      ...Array.from({ length: 4 }, (_, i) => ({
        amount: faker.number.float({ min: 500, max: 10000, fractionDigits: 2 }),
        status: WithdrawalStatus.REJECTED,
        observation: faker.helpers.arrayElement([
          'Insufficient trading days completed',
          'Account verification required',
          'Trading rules violation detected',
          'Invalid withdrawal amount',
          'Minimum profit target not reached'
        ]),
        createdAt: faker.date.past({ years: 0.16 }),
      })),
    ];

    // Crear withdrawals
    for (let i = 0; i < withdrawalData.length; i++) {
      const data = withdrawalData[i];
      const user = users[i % users.length];
      const challenge = challenges[i % Math.max(challenges.length, 1)];
      
      // Seleccionar tipo de wallet aleatoriamente
      const walletType = faker.helpers.arrayElement(['crypto', 'bank', 'paypal']);
      let wallet: string;
      
      switch (walletType) {
        case 'crypto':
          wallet = cryptoWallets[Math.floor(Math.random() * cryptoWallets.length)];
          break;
        case 'bank':
          wallet = bankAccounts[Math.floor(Math.random() * bankAccounts.length)];
          break;
        case 'paypal':
          wallet = paypalEmails[Math.floor(Math.random() * paypalEmails.length)];
          break;
        default:
          wallet = cryptoWallets[0];
      }

      await ensureWithdrawal(ds, {
        userID: user.userID,
        wallet: wallet,
        amount: data.amount,
        observation: data.observation,
        status: data.status,
        challengeID: challenge?.challengeID,
        createdAt: data.createdAt,
      });
    }

    // Crear algunos withdrawals específicos para testing
    const testWithdrawals = [
      {
        amount: 5000.00,
        wallet: '1BvBMSEYstWetqTFn5Au4m4GFg7xJaNVN2',
        status: WithdrawalStatus.PAID,
        observation: 'First successful withdrawal - Bitcoin',
      },
      {
        amount: 12500.50,
        wallet: 'ES91 2100 0418 4502 0005 1332',
        status: WithdrawalStatus.APPROVED,
        observation: 'Large withdrawal approved - Bank transfer',
      },
      {
        amount: 3000.00,
        wallet: 'elite.trader@gmail.com',
        status: WithdrawalStatus.PENDING,
        observation: 'PayPal withdrawal under review',
      },
    ];

    for (const testData of testWithdrawals) {
      const user = users[Math.floor(Math.random() * users.length)];
      const challenge = challenges[Math.floor(Math.random() * Math.max(challenges.length, 1))];
      
      await ensureWithdrawal(ds, {
        userID: user.userID,
        wallet: testData.wallet,
        amount: testData.amount,
        observation: testData.observation,
        status: testData.status,
        challengeID: challenge?.challengeID,
      });
    }

    console.log('🎉 Seed de withdrawals completado.');
  } catch (err) {
    console.error('❌ Error durante el seed de withdrawals:', err);
    process.exitCode = 1;
  } finally {
    await app.close();
  }
}

bootstrap();