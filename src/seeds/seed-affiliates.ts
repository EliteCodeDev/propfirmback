/* eslint-disable no-console */
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { DataSource, DeepPartial } from 'typeorm';
import { faker } from '@faker-js/faker';

import { Affiliate } from '../modules/affiliates/entities/affiliate.entity';
import { UserAccount } from '../modules/users/entities/user-account.entity';
import { AffiliateStatus } from '../common/enums/affiliate-status.enum';

async function ensureAffiliate(
  ds: DataSource,
  params: {
    referralCode: string;
    parentAffiliateID?: string;
    level: number;
    status: AffiliateStatus;
    referralUrl?: string;
    commissionRate: number;
    userID?: string;
  }
) {
  const affiliateRepo = ds.getRepository(Affiliate);

  let affiliate = await affiliateRepo.findOne({
    where: { referralCode: params.referralCode },
  });

  if (!affiliate) {
    const payload: DeepPartial<Affiliate> = {
      referralCode: params.referralCode,
      parentAffiliateID: params.parentAffiliateID || null,
      level: params.level,
      status: params.status,
      referralUrl: params.referralUrl || `https://propfirm.com/ref/${params.referralCode}`,
      commissionRate: params.commissionRate,
      userID: params.userID || null,
    };

    affiliate = affiliateRepo.create(payload);
    await affiliateRepo.save(affiliate);
    console.log(`✅ Affiliate creado: ${params.referralCode}`);
  } else {
    console.log(`↺ Affiliate ya existe: ${params.referralCode}`);
  }

  return affiliate;
}

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn', 'log'],
  });

  try {
    const ds = app.get(DataSource);
    const userRepo = ds.getRepository(UserAccount);

    // Obtener algunos usuarios para asignar como affiliates
    const users = await userRepo.find({ take: 10, order: { createdAt: 'ASC' as any } });
    
    if (users.length === 0) {
      console.log('⚠️ No hay usuarios para asignar como affiliates. Ejecuta primero el seed de usuarios.');
      return;
    }

    // 1) Affiliate principal (nivel 1)
    const mainAffiliate = await ensureAffiliate(ds, {
      referralCode: 'FTMO2024',
      level: 1,
      status: AffiliateStatus.ACTIVE,
      commissionRate: 15.00,
      userID: users[0]?.userID,
    });

    // 2) Affiliates de nivel 2 (sub-affiliates)
    const subAffiliates = [];
    for (let i = 1; i <= 5; i++) {
      const affiliate = await ensureAffiliate(ds, {
        referralCode: `SUB${String(i).padStart(3, '0')}`,
        parentAffiliateID: mainAffiliate.affiliateID,
        level: 2,
        status: AffiliateStatus.ACTIVE,
        commissionRate: 10.00,
        userID: users[i]?.userID,
      });
      subAffiliates.push(affiliate);
    }

    // 3) Affiliates independientes
    const independentCodes = [
      'TRADER_PRO',
      'FOREX_KING',
      'PROFIT_MASTER',
      'ELITE_TRADER',
      'MARKET_GURU',
      'TRADING_LEGEND',
      'FOREX_EXPERT',
      'PROFIT_HUNTER'
    ];

    for (let i = 0; i < independentCodes.length; i++) {
      const status = i < 6 ? AffiliateStatus.ACTIVE : 
                    i < 7 ? AffiliateStatus.INACTIVE : AffiliateStatus.BANNED;
      
      await ensureAffiliate(ds, {
        referralCode: independentCodes[i],
        level: 1,
        status,
        commissionRate: faker.number.float({ min: 5.0, max: 20.0, fractionDigits: 2 }),
        userID: users[i + 6]?.userID,
      });
    }

    // 4) Affiliates de nivel 3 (sub-sub-affiliates)
    for (let i = 0; i < 3; i++) {
      await ensureAffiliate(ds, {
        referralCode: `L3_${String(i + 1).padStart(2, '0')}`,
        parentAffiliateID: subAffiliates[i]?.affiliateID,
        level: 3,
        status: AffiliateStatus.ACTIVE,
        commissionRate: 5.00,
      });
    }

    console.log('🎉 Seed de affiliates completado.');
  } catch (err) {
    console.error('❌ Error durante el seed de affiliates:', err);
    process.exitCode = 1;
  } finally {
    await app.close();
  }
}

bootstrap();