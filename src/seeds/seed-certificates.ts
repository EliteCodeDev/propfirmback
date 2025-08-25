/* eslint-disable no-console */
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { DataSource, DeepPartial } from 'typeorm';
import { faker } from '@faker-js/faker';

import { Certificate } from '../modules/certificates/entities/certificate.entity';
import { UserAccount } from '../modules/users/entities/user-account.entity';
import { Challenge } from '../modules/challenges/entities/challenge.entity';
import { CertificateType } from '../common/enums/certificate-type.enum';
import { ChallengeStatus } from '../common/enums/challenge-status.enum';

async function ensureCertificate(
  ds: DataSource,
  params: {
    userID: string;
    monto: number;
    qrLink: string;
    challengeID: string;
    type: CertificateType;
    certificateDate: Date;
  }
) {
  const certificateRepo = ds.getRepository(Certificate);

  // Verificar si ya existe un certificado para este challenge y tipo
  const existing = await certificateRepo.findOne({
    where: {
      challengeID: params.challengeID,
      type: params.type,
    },
  });

  if (existing) {
    console.log(`↺ Certificate ya existe para challenge ${params.challengeID} - ${params.type}`);
    return existing;
  }

  const payload: DeepPartial<Certificate> = {
    userID: params.userID,
    monto: params.monto,
    qrLink: params.qrLink,
    challengeID: params.challengeID,
    type: params.type,
    certificateDate: params.certificateDate,
  };

  const certificate = certificateRepo.create(payload);
  await certificateRepo.save(certificate);
  console.log(`✅ Certificate creado: ${params.type} para challenge ${params.challengeID}`);

  return certificate;
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
      where: [
        { status: ChallengeStatus.APPROVED },
        { status: ChallengeStatus.WITHDRAWABLE },
        { status: ChallengeStatus.WITHDRAWN },
      ],
      take: 50,
      relations: ['user'],
    });

    if (users.length === 0) {
      console.log('⚠️ No hay usuarios para crear certificates. Ejecuta primero el seed de usuarios.');
      return;
    }

    if (challenges.length === 0) {
      console.log('⚠️ No hay challenges aprobados para crear certificates. Ejecuta primero el seed de challenges.');
      return;
    }

    // Generar QR links realistas
    const generateQRLink = (certificateID: string, type: CertificateType): string => {
      const baseUrl = 'https://verify.propfirm.com/certificate';
      const token = faker.string.alphanumeric(32);
      return `${baseUrl}/${type}/${certificateID}?token=${token}`;
    };

    // Crear certificates para challenges aprobados
    for (const challenge of challenges) {
      const fromDate = challenge.endDate || challenge.startDate;
      const toDate = new Date();
      const certificateDate = fromDate <= toDate 
        ? faker.date.between({ from: fromDate, to: toDate })
        : faker.date.past({ years: 0.5 });

      // Determinar el tipo de certificado basado en la fase y estado del challenge
      let certificateType: CertificateType;
      let monto: number;

      if (challenge.status === ChallengeStatus.WITHDRAWN) {
        certificateType = CertificateType.withdrawal;
        monto = challenge.dynamicBalance || 0;
      } else if (challenge.numPhase === 1) {
        certificateType = CertificateType.phase1;
        monto = challenge.dynamicBalance || 0;
      } else if (challenge.numPhase === 2) {
        certificateType = CertificateType.phase2;
        monto = challenge.dynamicBalance || 0;
      } else {
        certificateType = CertificateType.real;
        monto = challenge.dynamicBalance || 0;
      }

      const certificateID = faker.string.uuid();
      const qrLink = generateQRLink(certificateID, certificateType);

      await ensureCertificate(ds, {
        userID: challenge.userID,
        monto: monto,
        qrLink: qrLink,
        challengeID: challenge.challengeID,
        type: certificateType,
        certificateDate: certificateDate,
      });
    }

    // Crear algunos certificates específicos para testing
    const testCertificates = [
      {
        type: CertificateType.phase1,
        monto: 110000.00,
        description: 'Phase 1 completion certificate - $100K challenge',
      },
      {
        type: CertificateType.phase2,
        monto: 115000.00,
        description: 'Phase 2 completion certificate - $100K challenge',
      },
      {
        type: CertificateType.real,
        monto: 125000.00,
        description: 'Real account certificate - $100K challenge',
      },
      {
        type: CertificateType.withdrawal,
        monto: 5000.00,
        description: 'Withdrawal certificate - First payout',
      },
    ];

    // Crear certificates de prueba si hay challenges disponibles
    for (let i = 0; i < Math.min(testCertificates.length, challenges.length); i++) {
      const testData = testCertificates[i];
      const challenge = challenges[i];
      const certificateID = faker.string.uuid();
      const qrLink = generateQRLink(certificateID, testData.type);

      await ensureCertificate(ds, {
        userID: challenge.userID,
        monto: testData.monto,
        qrLink: qrLink,
        challengeID: challenge.challengeID,
        type: testData.type,
        certificateDate: faker.date.recent({ days: 30 }),
      });
    }

    // Crear certificates adicionales para usuarios que han completado múltiples fases
    const multiPhaseCertificates = [
      // Usuario que completó todas las fases
      {
        phases: [CertificateType.phase1, CertificateType.phase2, CertificateType.real],
        montos: [108000, 116000, 128000],
      },
      // Usuario que completó fase 1 y 2
      {
        phases: [CertificateType.phase1, CertificateType.phase2],
        montos: [54000, 58000],
      },
      // Usuario con múltiples withdrawals
      {
        phases: [CertificateType.withdrawal, CertificateType.withdrawal],
        montos: [3000, 7500],
      },
    ];

    for (let i = 0; i < Math.min(multiPhaseCertificates.length, challenges.length - testCertificates.length); i++) {
      const multiPhase = multiPhaseCertificates[i];
      const challenge = challenges[testCertificates.length + i];
      
      for (let j = 0; j < multiPhase.phases.length; j++) {
        const certificateID = faker.string.uuid();
        const qrLink = generateQRLink(certificateID, multiPhase.phases[j]);
        
        await ensureCertificate(ds, {
          userID: challenge.userID,
          monto: multiPhase.montos[j],
          qrLink: qrLink,
          challengeID: challenge.challengeID,
          type: multiPhase.phases[j],
          certificateDate: faker.date.past({ years: 0.5 }),
        });
      }
    }

    console.log('🎉 Seed de certificates completado.');
  } catch (err) {
    console.error('❌ Error durante el seed de certificates:', err);
    process.exitCode = 1;
  } finally {
    await app.close();
  }
}

bootstrap();