import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CustomerOrder } from './entities/customer-order.entity';
import { CreateOrderDto } from './dto/create-order.dto';
import { CreateCompleteOrderDto } from './dto/create-complete-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { MailerService } from '../mailer/mailer.service';
import { ChallengesService } from '../challenges/challenges.service';
import { ChallengeTemplatesService } from '../challenge-templates/challenge-templates.service';
import { SmtApiClient } from 'src/modules/smt-api/client/smt-api.client';
import { BrokerAccountsService } from '../broker-accounts/broker-accounts.service';
import { UsersService } from '../users/services/users.service';
import {
  createUserByOrderResponse,
  createSmtApiChallengeData,
  ServiceResult,
} from './types';
import { ConfigService } from '@nestjs/config';
import { wooUserData } from './types';
import { generateRandomPassword } from 'src/common/utils/randomPassword';
import { ChallengeStatus, OrderStatus } from 'src/common/enums';
import { Challenge } from '../challenges/entities/challenge.entity';
@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(CustomerOrder)
    private orderRepository: Repository<CustomerOrder>,
    private mailerService: MailerService,
    private configService: ConfigService,
    private challengesService: ChallengesService,
    private challengeTemplatesService: ChallengeTemplatesService,
    private brokerAccountsService: BrokerAccountsService,
    private usersService: UsersService,
    private smtApiService: SmtApiClient,
  ) {}

  async create(createOrderDto: CreateOrderDto): Promise<CustomerOrder> {
    const order = this.orderRepository.create({
      ...createOrderDto,
    });

    const savedOrder = await this.orderRepository.save(order);

    return savedOrder;
  }
  async createCompleteOrder(
    createOrderDto: CreateCompleteOrderDto,
  ): Promise<ServiceResult<CustomerOrder>> {
    try {
      // find user by email
      let user = await this.usersService
        .findByEmail(createOrderDto.user.email)
        .catch((err) => {
          throw { failedAt: 'user_lookup', original: err };
        });

      if (!user) {
        // create new user
        const userRes = await this.createUserByOrder(createOrderDto.user);
        if (userRes.status === 'error' || !userRes.data) {
          return {
            status: 'error',
            message: userRes.message || 'No se pudo crear el usuario',
            failedAt: userRes.failedAt ?? 'user_create',
            details: userRes.details,
          };
        }
        const { password, user: createdUser } = userRes.data;
        user = createdUser;
        // send email with credentials
        try {
          await this.mailerService.sendMail({
            to: user.email,
            subject: 'Your account has been created',
            template: 'account-credentials',
            context: {
              email: user.email,
              password: password,
              username: user.username,
              landingUrl: this.configService.get<string>('app.clientUrl'),
            },
          });
        } catch (err) {
          return {
            status: 'error',
            message: 'No se pudo enviar el correo de credenciales de la cuenta',
            failedAt: 'email_send',
            details: err?.message ?? err,
          };
        }
      }

      // get relation and balance
      let relation;
      try {
        const { relations } =
          await this.challengeTemplatesService.findOnePlanByWooID(
            createOrderDto.product.productID,
          );
        relation = relations?.[0];
        if (!relation) {
          return {
            status: 'error',
            message: 'No se encontró una relación válida para el plan',
            failedAt: 'relation_fetch',
          };
        }
      } catch (err) {
        return {
          status: 'error',
          message: 'Fallo al obtener la relación del plan',
          failedAt: 'relation_fetch',
          details: err?.message ?? err,
        };
      }

      const relationBalance = relation.balances?.find(
        (bal) => bal.wooID === createOrderDto.product.variationID,
      );
      if (!relationBalance) {
        return {
          status: 'error',
          message:
            'No se encontró el balance correspondiente a la variación seleccionada',
          failedAt: 'relation_balance_match',
        };
      }

      const ip = '';
      const leverage = '1:100';
      const platform = 'mt5';

      const challengeRes = await this.createSmtApiChallenge({
        user,
        createOrderDto,
        relationBalance,
        leverage,
        ip,
        platform,
        relation,
      });

      if (challengeRes.status === 'error' || !challengeRes.data) {
        return {
          status: 'error',
          message: challengeRes.message || 'No se pudo crear el challenge',
          failedAt: challengeRes.failedAt ?? 'challenge_create',
          details: challengeRes.details,
        };
      }

      const challenge = challengeRes.data;

      // build and save order
      const order = this.orderRepository.create({
        challenge,
        user,
        createDateTime: new Date(),
        product: JSON.stringify(createOrderDto.product),
        total: createOrderDto.product.price,
        orderStatus: OrderStatus.COMPLETED,
        wooID: createOrderDto.wooID,
      });

      let savedOrder: CustomerOrder;
      try {
        savedOrder = await this.orderRepository.save(order);
      } catch (err) {
        return {
          status: 'error',
          message: 'Fallo al guardar la orden en la base de datos',
          failedAt: 'order_save',
          details: err?.message ?? err,
        };
      }

      // Send confirmation email
      try {
        await this.mailerService.sendMail({
          to: savedOrder.user.email,
          subject: 'Challenge is ready to use!',
          template: 'challenge-credentials',
          context: {
            email: savedOrder.user.email,
            challenge_type: savedOrder.challenge.relation.plan.name,
            Account_size: savedOrder.challenge.brokerAccount.innitialBalance,
            login_details: {
              login: savedOrder.challenge.brokerAccount.login,
              password: savedOrder.challenge.brokerAccount.password,
              server: savedOrder.challenge.brokerAccount.server,
              platform: savedOrder.challenge.brokerAccount.platform,
            },
            landingUrl: this.configService.get<string>('app.clientUrl'),
          },
        });
      } catch (err) {
        return {
          status: 'error',
          message:
            'La orden fue creada, pero falló el envío del correo con credenciales',
          failedAt: 'email_send',
          details: err?.message ?? err,
        };
      }

      return {
        status: 'success',
        message: 'Orden creada correctamente',
        data: savedOrder,
      };
    } catch (err) {
      return {
        status: 'error',
        message: 'Error inesperado al crear la orden completa',
        failedAt: err?.failedAt,
        details: err?.original?.message ?? err?.message ?? err,
      };
    }
  }

  async findAll(query: any) {
    const { page = 1, limit = 10, status } = query;
    const skip = (page - 1) * limit;

    const whereConditions: any = {};
    if (status) {
      whereConditions.statusOrder = status;
    }

    const [orders, total] = await this.orderRepository.findAndCount({
      where: whereConditions,
      skip,
      take: limit,
      order: { createDateTime: 'DESC' },
      relations: ['user', 'challenge'],
    });

    return {
      data: orders,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findByUserId(userID: string, query: any) {
    const { page = 1, limit = 10, status } = query;
    const skip = (page - 1) * limit;

    const whereConditions: any = { userID };
    if (status) {
      whereConditions.statusOrder = status;
    }

    const [orders, total] = await this.orderRepository.findAndCount({
      where: whereConditions,
      skip,
      take: limit,
      order: { createDateTime: 'DESC' },
      relations: ['challenge'],
    });

    return {
      data: orders,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string): Promise<CustomerOrder> {
    const order = await this.orderRepository.findOne({
      where: { orderID: id },
      relations: ['user', 'challenge'],
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    return order;
  }

  async update(
    id: string,
    updateOrderDto: UpdateOrderDto,
  ): Promise<CustomerOrder> {
    const order = await this.findOne(id);

    Object.assign(order, updateOrderDto);

    return this.orderRepository.save(order);
  }

  async remove(id: string): Promise<void> {
    const order = await this.findOne(id);
    await this.orderRepository.remove(order);
  }

  async createUserByOrder(
    user: wooUserData,
  ): Promise<ServiceResult<createUserByOrderResponse>> {
    try {
      const password = generateRandomPassword();
      const userPayload = {
        email: user.email,
        username: user.email.replace('@', '_').replace('.', '_'),
        firstName: user.billing.first_name,
        lastName: user.billing.last_name,
        phone: user.billing.phone ? user.billing.phone : '',
        password,
      };
      const newUser = await this.usersService.create(userPayload);
      return {
        status: 'success',
        message: 'Usuario creado correctamente',
        data: { user: newUser, password },
      };
    } catch (err) {
      return {
        status: 'error',
        message: 'Fallo al crear el usuario',
        failedAt: 'user_create',
        details: err?.message ?? err,
      };
    }
  }

  async createSmtApiChallenge(
    createSmtApiChallengeData: createSmtApiChallengeData,
  ): Promise<ServiceResult<Challenge>> {
    const {
      user,
      createOrderDto,
      relationBalance,
      leverage,
      ip,
      parentID,
      platform,
      relation,
    } = createSmtApiChallengeData;

    try {
      // smt-api account creation
      let accountCredentials: any;
      try {
        accountCredentials = await this.smtApiService.createAccount({
          name: user.firstName,
          lastName: user.lastName,
          email: createOrderDto.user.email,
          balance: relationBalance.balance.balance.toString(),
          leverage,
          phone: user.phone || '',
          platform,
          ip,
        });
      } catch (err) {
        return {
          status: 'error',
          message: 'Fallo al crear la cuenta en SMT API',
          failedAt: 'smt_account_create',
          details: err?.message ?? err,
        };
      }

      // broker account creation
      let brokerAccount;
      try {
        brokerAccount = await this.brokerAccountsService.create({
          login: accountCredentials.userDataAccount.login,
          password: accountCredentials.userDataAccount.password,
          server: accountCredentials.userDataAccount.servidor,
          platform: accountCredentials.userDataAccount.tipoCuenta,
          isUsed: true,
          investorPass: accountCredentials.userDataAccount.investorPassword,
          serverIp: ip,
          innitialBalance: relationBalance.balance.balance,
        });
      } catch (err) {
        return {
          status: 'error',
          message: 'Fallo al crear la cuenta de bróker',
          failedAt: 'broker_account_create',
          details: err?.message ?? err,
        };
      }

      // challenge creation
      try {
        const challenge = await this.challengesService.create({
          brokerAccountID: brokerAccount.brokerAccountID,
          userID: user.userID,
          relationID: relation.relationID,
          startDate: new Date(),
          numPhase: relation.stages.sort((a, b) => a.numPhase - b.numPhase)[0]
            .numPhase,
          isActive: true,
          status: ChallengeStatus.INNITIAL,
        });
        return {
          status: 'success',
          message: 'Challenge creado correctamente',
          data: challenge,
        };
      } catch (err) {
        return {
          status: 'error',
          message: 'Fallo al crear el challenge',
          failedAt: 'challenge_create',
          details: err?.message ?? err,
        };
      }
    } catch (err) {
      return {
        status: 'error',
        message: 'Error inesperado al crear el challenge',
        details: err?.message ?? err,
      };
    }
  }
}
