/* eslint-disable no-console */
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { DataSource, DeepPartial } from 'typeorm';
import { faker } from '@faker-js/faker';

import { CustomerOrder } from '../modules/orders/entities/customer-order.entity';
import { UserAccount } from '../modules/users/entities/user-account.entity';
import { Challenge } from '../modules/challenges/entities/challenge.entity';
import { OrderStatus } from '../common/enums/order-status.enum';

async function ensureOrder(
  ds: DataSource,
  params: {
    userID: string;
    orderStatus: OrderStatus;
    wooID?: number;
    total: number;
    product: string;
    challengeID?: string;
    createDateTime?: Date;
  }
) {
  const orderRepo = ds.getRepository(CustomerOrder);

  const payload: DeepPartial<CustomerOrder> = {
    userID: params.userID,
    orderStatus: params.orderStatus,
    wooID: params.wooID || null,
    total: params.total,
    product: params.product,
    challengeID: params.challengeID || null,
    createDateTime: params.createDateTime || new Date(),
  };

  const order = orderRepo.create(payload);
  await orderRepo.save(order);
  console.log(`✅ Order creado: ${params.product} - $${params.total} para usuario ${params.userID}`);

  return order;
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
    const challenges = await challengeRepo.find({ take: 50 });

    if (users.length === 0) {
      console.log('⚠️ No hay usuarios para crear orders. Ejecuta primero el seed de usuarios.');
      return;
    }

    // Productos típicos de prop firms (challenges)
    const challengeProducts = [
      {
        name: 'FTMO Challenge $10,000',
        price: 155.00,
        description: 'Two-step evaluation process for $10,000 account',
      },
      {
        name: 'FTMO Challenge $25,000',
        price: 250.00,
        description: 'Two-step evaluation process for $25,000 account',
      },
      {
        name: 'FTMO Challenge $50,000',
        price: 345.00,
        description: 'Two-step evaluation process for $50,000 account',
      },
      {
        name: 'FTMO Challenge $100,000',
        price: 540.00,
        description: 'Two-step evaluation process for $100,000 account',
      },
      {
        name: 'FTMO Challenge $200,000',
        price: 1080.00,
        description: 'Two-step evaluation process for $200,000 account',
      },
      {
        name: 'FTMO Challenge $400,000',
        price: 2160.00,
        description: 'Two-step evaluation process for $400,000 account',
      },
      {
        name: 'PropFirm Instant Funding $10,000',
        price: 89.00,
        description: 'Instant funding account - no evaluation required',
      },
      {
        name: 'PropFirm Instant Funding $25,000',
        price: 189.00,
        description: 'Instant funding account - no evaluation required',
      },
      {
        name: 'PropFirm Reset Fee',
        price: 25.00,
        description: 'Challenge reset fee for failed attempts',
      },
      {
        name: 'PropFirm Addon - News Trading',
        price: 50.00,
        description: 'News trading addon for challenge accounts',
      },
    ];

    // Crear orders con distribución realista de estados
    const orderDistribution = [
      // 70% completados (exitosos)
      ...Array.from({ length: 35 }, () => OrderStatus.COMPLETED),
      // 15% procesando
      ...Array.from({ length: 8 }, () => OrderStatus.PROCESSING),
      // 8% pendientes
      ...Array.from({ length: 4 }, () => OrderStatus.PENDING),
      // 4% cancelados
      ...Array.from({ length: 2 }, () => OrderStatus.CANCELLED),
      // 2% fallidos
      ...Array.from({ length: 1 }, () => OrderStatus.FAILED),
      // 1% reembolsados
      ...Array.from({ length: 1 }, () => OrderStatus.REFUNDED),
    ];

    // Crear orders
    for (let i = 0; i < orderDistribution.length; i++) {
      const status = orderDistribution[i];
      const user = users[i % users.length];
      const product = challengeProducts[Math.floor(Math.random() * challengeProducts.length)];
      const challenge = challenges[i % Math.max(challenges.length, 1)];
      
      // Generar WooCommerce ID realista
      const wooID = faker.number.int({ min: 10000, max: 99999 });
      
      // Fecha de creación realista
      const createDateTime = faker.date.past({ years: 1 });
      
      // Aplicar descuentos ocasionales
      let finalPrice = product.price;
      if (Math.random() < 0.15) { // 15% de probabilidad de descuento
        const discount = faker.number.float({ min: 0.1, max: 0.3, fractionDigits: 2 });
        finalPrice = product.price * (1 - discount);
      }

      await ensureOrder(ds, {
        userID: user.userID,
        orderStatus: status,
        wooID: wooID,
        total: finalPrice,
        product: JSON.stringify({
          name: product.name,
          description: product.description,
          originalPrice: product.price,
          finalPrice: finalPrice,
          currency: 'USD',
        }),
        challengeID: status === OrderStatus.COMPLETED ? challenge?.challengeID : undefined,
        createDateTime: createDateTime,
      });
    }

    // Crear orders específicos para testing
    const testOrders = [
      {
        product: {
          name: 'FTMO Challenge $100,000 - Black Friday',
          description: 'Special Black Friday offer - 50% discount',
          originalPrice: 540.00,
          finalPrice: 270.00,
          currency: 'USD',
        },
        status: OrderStatus.COMPLETED,
      },
      {
        product: {
          name: 'PropFirm Challenge $50,000 - Early Bird',
          description: 'Early bird special pricing',
          originalPrice: 345.00,
          finalPrice: 299.00,
          currency: 'USD',
        },
        status: OrderStatus.PROCESSING,
      },
      {
        product: {
          name: 'FTMO Challenge $25,000 - Student Discount',
          description: 'Student discount applied',
          originalPrice: 250.00,
          finalPrice: 200.00,
          currency: 'USD',
        },
        status: OrderStatus.PENDING,
      },
      {
        product: {
          name: 'PropFirm Reset Fee - Multiple Attempts',
          description: 'Reset fee for third attempt',
          originalPrice: 25.00,
          finalPrice: 25.00,
          currency: 'USD',
        },
        status: OrderStatus.FAILED,
      },
    ];

    for (let i = 0; i < testOrders.length && i < users.length; i++) {
      const testOrder = testOrders[i];
      const user = users[i];
      const challenge = challenges[i % Math.max(challenges.length, 1)];
      
      await ensureOrder(ds, {
        userID: user.userID,
        orderStatus: testOrder.status,
        wooID: faker.number.int({ min: 10000, max: 99999 }),
        total: testOrder.product.finalPrice,
        product: JSON.stringify(testOrder.product),
        challengeID: testOrder.status === OrderStatus.COMPLETED ? challenge?.challengeID : undefined,
        createDateTime: faker.date.recent({ days: 30 }),
      });
    }

    // Crear orders de usuarios frecuentes (múltiples compras)
    const frequentBuyers = users.slice(0, 5); // Primeros 5 usuarios
    
    for (const buyer of frequentBuyers) {
      const numOrders = faker.number.int({ min: 2, max: 5 });
      
      for (let i = 0; i < numOrders; i++) {
        const product = challengeProducts[Math.floor(Math.random() * challengeProducts.length)];
        const status = faker.helpers.arrayElement([
          OrderStatus.COMPLETED,
          OrderStatus.COMPLETED,
          OrderStatus.COMPLETED,
          OrderStatus.CANCELLED,
        ]); // Mayoría completados
        
        const challenge = challenges[Math.floor(Math.random() * Math.max(challenges.length, 1))];
        
        await ensureOrder(ds, {
          userID: buyer.userID,
          orderStatus: status,
          wooID: faker.number.int({ min: 10000, max: 99999 }),
          total: product.price,
          product: JSON.stringify({
            name: product.name,
            description: product.description,
            originalPrice: product.price,
            finalPrice: product.price,
            currency: 'USD',
          }),
          challengeID: status === OrderStatus.COMPLETED ? challenge?.challengeID : undefined,
          createDateTime: faker.date.past({ years: 0.5 }),
        });
      }
    }

    console.log('🎉 Seed de orders completado.');
  } catch (err) {
    console.error('❌ Error durante el seed de orders:', err);
    process.exitCode = 1;
  } finally {
    await app.close();
  }
}

bootstrap();