/* eslint-disable no-console */
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { DataSource, DeepPartial } from 'typeorm';
import { faker } from '@faker-js/faker';

import { BrokerAccount } from '../modules/broker-accounts/entities/broker-account.entity';

async function ensureBrokerAccount(
  ds: DataSource,
  params: {
    login: string;
    password: string;
    server: string;
    serverIp: string;
    platform: string;
    isUsed: boolean;
    investorPass?: string;
    innitialBalance: number;
  }
) {
  const brokerRepo = ds.getRepository(BrokerAccount);

  let account = await brokerRepo.findOne({
    where: { login: params.login },
  });

  if (!account) {
    const payload: DeepPartial<BrokerAccount> = {
      login: params.login,
      password: params.password,
      server: params.server,
      serverIp: params.serverIp,
      platform: params.platform,
      isUsed: params.isUsed,
      investorPass: params.investorPass || `inv${params.login}`,
      innitialBalance: params.innitialBalance,
    };

    account = brokerRepo.create(payload);
    await brokerRepo.save(account);
    console.log(`✅ Broker Account creado: ${params.login} (${params.server})`);
  } else {
    console.log(`↺ Broker Account ya existe: ${params.login}`);
  }

  return account;
}

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn', 'log'],
  });

  try {
    const ds = app.get(DataSource);

    // Servidores MT4/MT5 realistas
    const servers = [
      { name: 'MetaCore-Demo01', ip: '185.25.48.12', platform: 'MT4' },
      { name: 'MetaCore-Demo02', ip: '185.25.48.13', platform: 'MT4' },
      { name: 'MetaCore-Live01', ip: '185.25.48.14', platform: 'MT4' },
      { name: 'MetaCore-Live02', ip: '185.25.48.15', platform: 'MT4' },
      { name: 'MetaCore-MT5-01', ip: '185.25.48.16', platform: 'MT5' },
      { name: 'MetaCore-MT5-02', ip: '185.25.48.17', platform: 'MT5' },
      { name: 'PropFirm-Demo', ip: '192.168.1.100', platform: 'MT4' },
      { name: 'PropFirm-Live', ip: '192.168.1.101', platform: 'MT5' },
    ];

    // Balances típicos de prop firms
    const balances = [10000, 25000, 50000, 100000, 200000, 400000];

    // Crear 100 cuentas broker realistas
    for (let i = 1; i <= 100; i++) {
      const accountNumber = String(50000 + i); // Números típicos de MT4/MT5
      const server = servers[Math.floor(Math.random() * servers.length)];
      const balance = balances[Math.floor(Math.random() * balances.length)];
      const isUsed = Math.random() < 0.3; // 30% de cuentas ya en uso

      // Generar contraseñas realistas
      const password = `Tr@de${faker.string.alphanumeric(6)}!`;
      const investorPass = `Inv${faker.string.alphanumeric(8)}`;

      await ensureBrokerAccount(ds, {
        login: accountNumber,
        password: password,
        server: server.name,
        serverIp: server.ip,
        platform: server.platform,
        isUsed: isUsed,
        investorPass: investorPass,
        innitialBalance: balance,
      });
    }

    // Crear algunas cuentas específicas para testing
    const testAccounts = [
      {
        login: '50001',
        password: 'TestPass123!',
        server: 'MetaCore-Demo01',
        serverIp: '185.25.48.12',
        platform: 'MT4',
        balance: 100000,
        isUsed: false,
      },
      {
        login: '50002',
        password: 'TestPass456!',
        server: 'MetaCore-Demo02',
        serverIp: '185.25.48.13',
        platform: 'MT4',
        balance: 50000,
        isUsed: true,
      },
      {
        login: '60001',
        password: 'MT5Pass789!',
        server: 'MetaCore-MT5-01',
        serverIp: '185.25.48.16',
        platform: 'MT5',
        balance: 200000,
        isUsed: false,
      },
    ];

    for (const account of testAccounts) {
      await ensureBrokerAccount(ds, {
        login: account.login,
        password: account.password,
        server: account.server,
        serverIp: account.serverIp,
        platform: account.platform,
        isUsed: account.isUsed,
        investorPass: `inv${account.login}`,
        innitialBalance: account.balance,
      });
    }

    console.log('🎉 Seed de broker accounts completado.');
  } catch (err) {
    console.error('❌ Error durante el seed de broker accounts:', err);
    process.exitCode = 1;
  } finally {
    await app.close();
  }
}

bootstrap();