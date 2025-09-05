/* eslint-disable no-console */
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { DataSource, DeepPartial } from 'typeorm';
import { faker } from '@faker-js/faker';

import { Verification } from '../modules/verification/entities/verification.entity';
import { Media } from '../modules/verification/entities/media.entity';
import { UserAccount } from '../modules/users/entities/user-account.entity';
import { VerificationStatus } from '../common/enums/verification-status.enum';
import { DocumentType } from '../common/enums/verification-document-type.enum';
import { MediaType } from '../common/enums/media-type.enum';

async function ensureVerification(
  ds: DataSource,
  params: {
    userID: string;
    status: VerificationStatus;
    documentType: DocumentType;
    numDocument?: string;
    rejectionReason?: string;
    submittedAt: Date;
    approvedAt?: Date;
    rejectedAt?: Date;
  }
) {
  const verificationRepo = ds.getRepository(Verification);
  const mediaRepo = ds.getRepository(Media);

  // Verificar si ya existe una verificación para este usuario y tipo de documento
  const existing = await verificationRepo.findOne({
    where: {
      userID: params.userID,
      documentType: params.documentType,
    },
  });

  if (existing) {
    console.log(`↺ Verification ya existe para usuario ${params.userID} - ${params.documentType}`);
    return existing;
  }

  const payload: DeepPartial<Verification> = {
    userID: params.userID,
    status: params.status,
    documentType: params.documentType,
    numDocument: params.numDocument || null,
    rejectionReason: params.rejectionReason || null,
    submittedAt: params.submittedAt,
    approvedAt: params.approvedAt || null,
    rejectedAt: params.rejectedAt || null,
  };

  const verification = verificationRepo.create(payload);
  await verificationRepo.save(verification);

  // Crear media files asociados
  const mediaFiles = [];
  const numFiles = faker.number.int({ min: 1, max: 3 });
  
  for (let i = 0; i < numFiles; i++) {
    const mediaType = faker.helpers.arrayElement([MediaType.IMAGE, MediaType.DOCUMENT]);
    const fileExtension = mediaType === MediaType.IMAGE ? 
      faker.helpers.arrayElement(['jpg', 'png', 'jpeg']) :
      faker.helpers.arrayElement(['pdf', 'doc', 'docx']);
    
    const mediaPayload: DeepPartial<Media> = {
      verificationID: verification.verificationID,
      url: `https://storage.propfirm.com/verifications/${verification.verificationID}/file_${i + 1}.${fileExtension}`,
      type: mediaType,
    };
    
    const media = mediaRepo.create(mediaPayload);
    await mediaRepo.save(media);
    mediaFiles.push(media);
  }

  console.log(`✅ Verification creado: ${params.documentType} para usuario ${params.userID} - ${params.status}`);
  return verification;
}

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn', 'log'],
  });

  try {
    const ds = app.get(DataSource);
    const userRepo = ds.getRepository(UserAccount);

    // Obtener usuarios
    const users = await userRepo.find({ take: 30, order: { createdAt: 'ASC' as any } });
    
    if (users.length === 0) {
      console.log('⚠️ No hay usuarios para crear verifications. Ejecuta primero el seed de usuarios.');
      return;
    }

    // Generar números de documento realistas
    const generateDocumentNumber = (type: DocumentType): string => {
      switch (type) {
        case DocumentType.DNI:
          return faker.string.numeric(8) + faker.string.alpha(1).toUpperCase(); // Formato español
        case DocumentType.PASSPORT:
          return faker.string.alpha(2).toUpperCase() + faker.string.numeric(7); // Formato internacional
        case DocumentType.DRIVER_LICENSE:
          return faker.string.alphanumeric(9).toUpperCase(); // Formato genérico
        case DocumentType.OTHER:
          return faker.string.alphanumeric(10).toUpperCase();
        default:
          return faker.string.alphanumeric(8).toUpperCase();
      }
    };

    // Razones de rechazo realistas
    const rejectionReasons = [
      'Document image is blurry or unreadable',
      'Document appears to be expired',
      'Document type does not match selection',
      'Personal information does not match account details',
      'Document appears to be altered or fraudulent',
      'Additional verification required - please submit utility bill',
      'Document quality is insufficient for verification',
      'Name on document does not match account name',
      'Document is not in acceptable format',
      'Selfie with document required for verification'
    ];

    // Crear verifications para usuarios
    for (let i = 0; i < users.length; i++) {
      const user = users[i];
      const numVerifications = faker.number.int({ min: 1, max: 2 }); // 1-2 verifications por usuario
      
      for (let j = 0; j < numVerifications; j++) {
        const documentType = faker.helpers.arrayElement(Object.values(DocumentType));
        const submittedAt = faker.date.past({ years: 1 });
        
        // Distribución realista de estados
        let status: VerificationStatus;
        let approvedAt: Date | undefined;
        let rejectedAt: Date | undefined;
        let rejectionReason: string | undefined;
        
        const statusRandom = Math.random();
        if (statusRandom < 0.6) {
          // 60% aprobados
          status = VerificationStatus.APPROVED;
          approvedAt = faker.date.between({ from: submittedAt, to: new Date() });
        } else if (statusRandom < 0.8) {
          // 20% pendientes
          status = VerificationStatus.PENDING;
        } else {
          // 20% rechazados
          status = VerificationStatus.REJECTED;
          rejectedAt = faker.date.between({ from: submittedAt, to: new Date() });
          rejectionReason = faker.helpers.arrayElement(rejectionReasons);
        }

        await ensureVerification(ds, {
          userID: user.userID,
          status,
          documentType,
          numDocument: generateDocumentNumber(documentType),
          rejectionReason,
          submittedAt,
          approvedAt,
          rejectedAt,
        });
      }
    }

    // Crear algunos casos específicos para testing
    const testCases = [
      {
        documentType: DocumentType.DNI,
        status: VerificationStatus.APPROVED,
        numDocument: '12345678A',
        submittedAt: new Date('2024-01-15'),
        approvedAt: new Date('2024-01-16'),
      },
      {
        documentType: DocumentType.PASSPORT,
        status: VerificationStatus.REJECTED,
        numDocument: 'AB1234567',
        rejectionReason: 'Document image is blurry or unreadable',
        submittedAt: new Date('2024-01-20'),
        rejectedAt: new Date('2024-01-22'),
      },
      {
        documentType: DocumentType.DRIVER_LICENSE,
        status: VerificationStatus.PENDING,
        numDocument: 'DL123456789',
        submittedAt: new Date('2024-01-25'),
      },
    ];

    for (let i = 0; i < testCases.length && i < users.length; i++) {
      const testCase = testCases[i];
      const user = users[i];
      
      await ensureVerification(ds, {
        userID: user.userID,
        status: testCase.status,
        documentType: testCase.documentType,
        numDocument: testCase.numDocument,
        rejectionReason: testCase.rejectionReason,
        submittedAt: testCase.submittedAt,
        approvedAt: testCase.approvedAt,
        rejectedAt: testCase.rejectedAt,
      });
    }

    // Asegurar una verificación PENDING para el usuario 30 del seeder (username: user30)
    const user30 = await userRepo.findOne({ where: { username: 'user30' } });
    if (user30) {
      const existingPending = await ds.getRepository(Verification).findOne({
        where: { userID: user30.userID, status: VerificationStatus.PENDING },
      });
      if (!existingPending) {
        await ensureVerification(ds, {
          userID: user30.userID,
          status: VerificationStatus.PENDING,
          documentType: DocumentType.OTHER,
          numDocument: 'USR30PEND1',
          submittedAt: new Date(),
        });
      } else {
        console.log('↺ Usuario user30 ya tiene una verificación en estado PENDING');
      }
    } else {
      console.log('⚠️ No se encontró el usuario user30 para crear verificación PENDING');
    }

    console.log('🎉 Seed de verifications completado.');
  } catch (err) {
    console.error('❌ Error durante el seed de verifications:', err);
    process.exitCode = 1;
  } finally {
    await app.close();
  }
}

bootstrap();