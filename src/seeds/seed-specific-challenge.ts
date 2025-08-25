/* eslint-disable no-console */
import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { DataSource } from 'typeorm';
import { faker } from '@faker-js/faker';
import { Challenge } from '../modules/challenges/entities/challenge.entity';
import { UserAccount } from '../modules/users/entities/user-account.entity';
import { Certificate } from '../modules/certificates/entities/certificate.entity';
import { CustomerOrder } from '../modules/orders/entities/customer-order.entity';
import { Verification } from '../modules/verification/entities/verification.entity';
import { Media } from '../modules/verification/entities/media.entity';
import { Withdrawal } from '../modules/withdrawals/entities/withdrawal.entity';
import { CertificateType } from '../common/enums/certificate-type.enum';
import { OrderStatus } from '../common/enums/order-status.enum';
import { VerificationStatus } from '../common/enums/verification-status.enum';
import { DocumentType } from '../common/enums/verification-document-type.enum';
import { MediaType } from '../common/enums/media-type.enum';
import { WithdrawalStatus } from '../common/enums/withdrawal-status.enum';
import { ChallengeDetails } from '../modules/challenges/entities/challenge-details.entity';
import { MetaStats, positionsDetails, RiskValidation } from '../common/utils/account';
import { RiskParams, MaxMinBalance, AverageMetrics } from '../common/utils/risk';
import { riskEvaluationResult } from '../common/types/risk-results';
import { OpenPosition, ClosedPosition, ResumenPositionOpen, ResumePositionClose } from '../common/utils/positions';

const CHALLENGE_ID = '788af3cf-db5c-4b79-aa7f-b781918f4c76';

async function bootstrap() {
  try {
    const app = await NestFactory.createApplicationContext(AppModule);
    const dataSource = app.get(DataSource);

    console.log('🚀 Iniciando seed específico para challenge:', CHALLENGE_ID);

    // Verificar que el challenge existe
    const challengeRepo = dataSource.getRepository(Challenge);
    const challenge = await challengeRepo.findOne({ 
      where: { challengeID: CHALLENGE_ID },
      relations: ['user']
    });

    if (!challenge) {
      console.log('❌ Challenge no encontrado:', CHALLENGE_ID);
      await app.close();
      return;
    }

    console.log('✅ Challenge encontrado:', challenge.challengeID, 'Usuario:', challenge.user?.email);

    // Obtener el usuario del challenge
    const user = challenge.user;
    if (!user) {
      console.log('❌ Challenge no tiene usuario asignado');
      await app.close();
      return;
    }

    // 1. Crear Certificate para el challenge
    const certificateRepo = dataSource.getRepository(Certificate);
    const existingCertificate = await certificateRepo.findOne({
      where: { challengeID: CHALLENGE_ID }
    });

    if (!existingCertificate) {
      const certificate = certificateRepo.create({
        userID: user.userID,
        monto: faker.number.float({ min: 5000, max: 50000, fractionDigits: 2 }),
        qrLink: `https://certificates.propfirm.com/verify/${faker.string.alphanumeric(32)}`,
        challengeID: CHALLENGE_ID,
        type: faker.helpers.arrayElement([CertificateType.phase1, CertificateType.phase2, CertificateType.real]),
        certificateDate: faker.date.past({ years: 0.5 })
      });
      await certificateRepo.save(certificate);
      console.log('✅ Certificate creado para challenge:', CHALLENGE_ID);
    } else {
      console.log('↺ Certificate ya existe para challenge:', CHALLENGE_ID);
    }

    // 2. Crear CustomerOrder para el challenge
    const orderRepo = dataSource.getRepository(CustomerOrder);
    const existingOrder = await orderRepo.findOne({
      where: { challengeID: CHALLENGE_ID }
    });

    if (!existingOrder) {
      const products = [
        { name: 'FTMO Challenge $25,000', price: 250 },
        { name: 'FTMO Challenge $50,000', price: 490 },
        { name: 'FTMO Challenge $100,000', price: 820 },
        { name: 'PropFirm Challenge $200,000', price: 1080 }
      ];
      const selectedProduct = faker.helpers.arrayElement(products);
      
      const order = orderRepo.create({
        userID: user.userID,
        createDateTime: faker.date.past({ years: 1 }),
        orderStatus: OrderStatus.COMPLETED,
        wooID: faker.number.int({ min: 1000, max: 9999 }),
        total: selectedProduct.price,
        product: JSON.stringify({
          name: selectedProduct.name,
          description: `Challenge account for ${selectedProduct.name.split('$')[1]}`,
          originalPrice: selectedProduct.price,
          finalPrice: selectedProduct.price,
          currency: 'USD'
        }),
        challengeID: CHALLENGE_ID
      });
      await orderRepo.save(order);
      console.log('✅ Order creado para challenge:', CHALLENGE_ID, '- $' + selectedProduct.price);
    } else {
      console.log('↺ Order ya existe para challenge:', CHALLENGE_ID);
    }

    // 3. Crear Verification para el usuario
    const verificationRepo = dataSource.getRepository(Verification);
    const mediaRepo = dataSource.getRepository(Media);
    
    const documentTypes = [DocumentType.DNI, DocumentType.PASSPORT, DocumentType.DRIVER_LICENSE];
    
    for (const docType of documentTypes) {
      const existingVerification = await verificationRepo.findOne({
        where: { userID: user.userID, documentType: docType }
      });

      if (!existingVerification) {
        const status = faker.helpers.arrayElement([
          VerificationStatus.APPROVED,
          VerificationStatus.PENDING,
          VerificationStatus.REJECTED
        ]);

        const verification = verificationRepo.create({
          userID: user.userID,
          status,
          documentType: docType,
          numDocument: faker.string.alphanumeric(10),
          rejectionReason: status === VerificationStatus.REJECTED ? 
            faker.helpers.arrayElement([
              'Document not clear',
              'Information mismatch',
              'Expired document',
              'Invalid document type'
            ]) : null,
          submittedAt: faker.date.past({ years: 0.5 }),
          approvedAt: status === VerificationStatus.APPROVED ? faker.date.recent({ days: 30 }) : null,
          rejectedAt: status === VerificationStatus.REJECTED ? faker.date.recent({ days: 30 }) : null
        });
        
        const savedVerification = await verificationRepo.save(verification);
        console.log('✅ Verification creado:', docType, 'para usuario', user.email, '- status:', status);

        // Crear media files para la verification
        const mediaTypes = [MediaType.IMAGE, MediaType.DOCUMENT];
        for (let i = 0; i < 2; i++) {
          const mediaType = faker.helpers.arrayElement(mediaTypes);
          const extension = mediaType === MediaType.IMAGE ? 'jpg' : 'pdf';
          
          const media = mediaRepo.create({
            url: `https://storage.propfirm.com/verifications/${savedVerification.verificationID}/${faker.string.alphanumeric(16)}.${extension}`,
            type: mediaType,
            createdAt: faker.date.past({ years: 0.5 }),
            scope: 'verification',
            verificationID: savedVerification.verificationID
          });
          await mediaRepo.save(media);
        }
      } else {
        console.log('↺ Verification ya existe para usuario', user.email, '- tipo:', docType);
      }
    }

    // 4. Crear Withdrawal para el challenge
    const withdrawalRepo = dataSource.getRepository(Withdrawal);
    const existingWithdrawal = await withdrawalRepo.findOne({
      where: { challengeID: CHALLENGE_ID }
    });

    if (!existingWithdrawal) {
      const wallets = [
        'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh',
        '0x742d35Cc6634C0532925a3b8D4C9db96DfB0b4C2',
        'rN7n7otQDd6FczFgLdSqtcsAUxDkw6fzRH',
        'IBAN: ES91 2100 0418 4502 0005 1332',
        'Account: 4532-1234-5678-9012'
      ];

      const withdrawal = withdrawalRepo.create({
        userID: user.userID,
        wallet: faker.helpers.arrayElement(wallets),
        amount: faker.number.float({ min: 1000, max: 25000, fractionDigits: 2 }),
        observation: faker.helpers.arrayElement([
          'Monthly profit withdrawal',
          'Performance bonus',
          'Challenge completion reward',
          'Regular withdrawal request'
        ]),
        status: faker.helpers.arrayElement([
          WithdrawalStatus.PENDING,
          WithdrawalStatus.APPROVED,
          WithdrawalStatus.PAID,
          WithdrawalStatus.REJECTED
        ]),
        createdAt: faker.date.past({ years: 0.16 }),
        challengeID: CHALLENGE_ID
      });
      await withdrawalRepo.save(withdrawal);
      console.log('✅ Withdrawal creado para challenge:', CHALLENGE_ID, '- $' + withdrawal.amount);
    } else {
      console.log('↺ Withdrawal ya existe para challenge:', CHALLENGE_ID);
    }

    // 5. Crear o actualizar ChallengeDetails
    const challengeDetailsRepo = dataSource.getRepository(ChallengeDetails);
    let challengeDetails = await challengeDetailsRepo.findOne({
      where: { challengeID: CHALLENGE_ID }
    });

    if (!challengeDetails) {
      challengeDetails = challengeDetailsRepo.create({
        challengeID: CHALLENGE_ID
      });
    }

    // Generar datos realistas para MetaStats
    const totalTrades = faker.number.int({ min: 5, max: 50 });
    const winningTrades = faker.number.int({ min: Math.floor(totalTrades * 0.4), max: Math.floor(totalTrades * 0.8) });
    const losingTrades = totalTrades - winningTrades;
    const winRate = totalTrades > 0 ? (winningTrades / totalTrades) * 100 : 0;
    const lossRate = 100 - winRate;
    const averageProfit = faker.number.float({ min: 200, max: 1500, fractionDigits: 2 });
    const averageLoss = faker.number.float({ min: -800, max: -100, fractionDigits: 2 });
    const currentBalance = challenge.dynamicBalance;
    const initialBalance = faker.number.float({ min: 50000, max: 200000, fractionDigits: 2 });
    const maxBalance = currentBalance + faker.number.float({ min: 1000, max: 5000, fractionDigits: 2 });
    const minBalance = currentBalance - faker.number.float({ min: 500, max: 3000, fractionDigits: 2 });
    const equity = currentBalance + faker.number.float({ min: -500, max: 500, fractionDigits: 2 });

    const metaStats: MetaStats = {
      equity,
      maxMinBalance: {
        maxBalance,
        minBalance
      } as MaxMinBalance,
      averageMetrics: {
        totalTrades,
        winningTrades,
        losingTrades,
        winRate,
        lossRate,
        averageProfit,
        averageLoss
      } as AverageMetrics,
      numTrades: totalTrades
    };

    // Generar posiciones abiertas
    const openPositionsCount = faker.number.int({ min: 0, max: 5 });
    const openPositions: OpenPosition[] = [];
    let totalOpenProfit = 0;

    for (let i = 0; i < openPositionsCount; i++) {
      const symbols = ['EURUSD', 'GBPUSD', 'USDJPY', 'AUDUSD', 'USDCAD', 'NZDUSD', 'EURGBP', 'EURJPY'];
      const types = ['BUY', 'SELL'];
      const symbol = faker.helpers.arrayElement(symbols);
      const type = faker.helpers.arrayElement(types);
      const volume = faker.number.float({ min: 0.01, max: 2.0, fractionDigits: 2 });
      const openPrice = faker.number.float({ min: 0.8, max: 2.0, fractionDigits: 5 });
      const currentPrice = openPrice + faker.number.float({ min: -0.01, max: 0.01, fractionDigits: 5 });
      const profit = faker.number.float({ min: -200, max: 300, fractionDigits: 2 });
      totalOpenProfit += profit;

      openPositions.push({
        OrderId: faker.string.numeric(8),
        Symbol: symbol,
        TimeOpen: faker.date.past({ years: 0.1 }).toISOString(),
        Type: type,
        Volume: volume,
        OpenPrice: openPrice,
        SL: type === 'BUY' ? openPrice - 0.005 : openPrice + 0.005,
        TP: type === 'BUY' ? openPrice + 0.01 : openPrice - 0.01,
        ClosePrice: currentPrice,
        Swap: faker.number.float({ min: -5, max: 5, fractionDigits: 2 }),
        Profit: profit,
        Commentary: faker.helpers.arrayElement(['Manual trade', 'EA trade', 'Scalping', 'Swing trade'])
      } as OpenPosition);
    }

    // Generar posiciones cerradas
    const closedPositionsCount = faker.number.int({ min: totalTrades - openPositionsCount, max: totalTrades });
    const closedPositions: ClosedPosition[] = [];
    let totalClosedProfit = 0;

    for (let i = 0; i < closedPositionsCount; i++) {
      const symbols = ['EURUSD', 'GBPUSD', 'USDJPY', 'AUDUSD', 'USDCAD', 'NZDUSD', 'EURGBP', 'EURJPY'];
      const types = ['BUY', 'SELL'];
      const symbol = faker.helpers.arrayElement(symbols);
      const type = faker.helpers.arrayElement(types);
      const volume = faker.number.float({ min: 0.01, max: 2.0, fractionDigits: 2 });
      const openPrice = faker.number.float({ min: 0.8, max: 2.0, fractionDigits: 5 });
      const closePrice = openPrice + faker.number.float({ min: -0.02, max: 0.02, fractionDigits: 5 });
      const profit = i < winningTrades ? 
        faker.number.float({ min: 50, max: 800, fractionDigits: 2 }) : 
        faker.number.float({ min: -600, max: -50, fractionDigits: 2 });
      totalClosedProfit += profit;

      const openTime = faker.date.past({ years: 0.5 });
      const closeTime = new Date(openTime.getTime() + faker.number.int({ min: 300000, max: 86400000 })); // 5 min to 24 hours

      closedPositions.push({
        OrderId: faker.string.numeric(8),
        TimeOpen: openTime.toISOString(),
        Type: type,
        Volume: volume,
        Symbol: symbol,
        OpenPrice: openPrice,
        SL: type === 'BUY' ? openPrice - 0.005 : openPrice + 0.005,
        TP: type === 'BUY' ? openPrice + 0.01 : openPrice - 0.01,
        TimeClose: closeTime.toISOString(),
        ClosePrice: closePrice,
        Commission: faker.number.float({ min: -10, max: -1, fractionDigits: 2 }),
        Rate: 1.0,
        Swap: faker.number.float({ min: -5, max: 5, fractionDigits: 2 }),
        Profit: profit,
        Commentary: faker.helpers.arrayElement(['Manual close', 'SL hit', 'TP hit', 'Manual trade'])
      } as ClosedPosition);
    }

    const positions: positionsDetails = {
      openPositions,
      closedPositions
    };

    // Generar parámetros de riesgo
    const rulesParams: RiskParams = {
      profitTarget: faker.number.float({ min: 5000, max: 15000, fractionDigits: 2 }),
      dailyDrawdown: faker.number.float({ min: 2000, max: 5000, fractionDigits: 2 }),
      maxDrawdown: faker.number.float({ min: 5000, max: 10000, fractionDigits: 2 }),
      lossPerTrade: faker.number.float({ min: 500, max: 1500, fractionDigits: 2 }),
      tradingDays: faker.number.int({ min: 10, max: 30 }),
      inactiveDays: faker.number.int({ min: 3, max: 7 })
    };

    // Generar evaluación de riesgo
    const currentProfit = totalClosedProfit + totalOpenProfit;
    const currentDrawdown = Math.abs(Math.min(0, minBalance - initialBalance));
    const daysTraded = faker.number.int({ min: 1, max: rulesParams.tradingDays });
    const inactiveDaysCount = faker.number.int({ min: 0, max: rulesParams.inactiveDays - 1 });

    const rulesValidation: riskEvaluationResult = {
      status: currentProfit >= rulesParams.profitTarget && currentDrawdown <= rulesParams.maxDrawdown,
      profitTarget: {
        status: currentProfit >= rulesParams.profitTarget,
        profit: currentProfit,
        profitTarget: rulesParams.profitTarget
      },
      dailyDrawdown: {
        status: currentDrawdown <= rulesParams.dailyDrawdown,
        drawdown: currentDrawdown
      },
      maxDrawdown: {
        status: currentDrawdown <= rulesParams.maxDrawdown,
        drawdown: currentDrawdown
      },
      tradingDays: {
        status: daysTraded >= rulesParams.tradingDays,
        numDays: daysTraded,
        positionsPerDay: {} // Simplificado para el seed
      },
      inactiveDays: {
        startDate: null,
        endDate: null,
        inactiveDays: inactiveDaysCount,
        status: inactiveDaysCount <= rulesParams.inactiveDays
      }
    };

    // Actualizar ChallengeDetails
    challengeDetails.metaStats = metaStats;
    challengeDetails.positions = positions;
    challengeDetails.rulesParams = rulesParams;
    challengeDetails.rulesValidation = rulesValidation;
    challengeDetails.lastUpdate = new Date();

    await challengeDetailsRepo.save(challengeDetails);
    console.log('✅ ChallengeDetails actualizado para challenge:', CHALLENGE_ID);
    console.log('   - Total trades:', totalTrades, '| Win rate:', winRate.toFixed(1) + '%');
    console.log('   - Open positions:', openPositionsCount, '| Closed positions:', closedPositionsCount);
    console.log('   - Current profit:', currentProfit.toFixed(2), '| Target:', rulesParams.profitTarget);
    console.log('   - Current drawdown:', currentDrawdown.toFixed(2), '| Max allowed:', rulesParams.maxDrawdown);

    console.log('🎉 Seed específico completado para challenge:', CHALLENGE_ID);
    await app.close();
  } catch (error) {
    console.error('❌ Error durante el seed específico:', error);
    process.exit(1);
  }
}

bootstrap();