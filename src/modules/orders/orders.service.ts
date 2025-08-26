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
import {
  createAccountResponse,
  SmtApiClient,
} from 'src/modules/data/smt-api/client/smt-api.client';
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
import { Logger } from '@nestjs/common';
import {
  ChallengeBalance,
  ChallengeRelation,
} from '../challenge-templates/entities';
import {
  createSmtApiResponseToBrokerAccount,
  getBasicRiskParams,
  getParameterValueBySlug,
} from 'src/common/utils/account-mapper';
import { UserAccount } from '../users/entities';
import { CreateBrokerAccountDto } from '../broker-accounts/dto/create-broker-account.dto';
@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);
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
      this.logger.log('User lookup result:', user);

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
        this.logger.log('New user created:', user);
        // send email with credentials
        try {
          this.logger.log('Sending email with credentials to:', user.email);
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
      let relation: ChallengeRelation;
      try {
        const { relations } =
          await this.challengeTemplatesService.findOnePlanByWooID(
            createOrderDto.product.productID,
          );
        this.logger.log('Plan relations fetched:', relations);
        relation = relations?.[0];
        relation =
          await this.challengeTemplatesService.findCompleteRelationChain(
            relation.relationID,
          );
        this.logger.log('Complete relation chain:', JSON.stringify(relation));
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
      this.logger.log(
        'Matched relation balance:',
        JSON.stringify(relationBalance),
      );
      const challengeBalance =
        await this.challengeTemplatesService.findOneBalance(
          relationBalance.balanceID,
        );
      if (!relationBalance || !challengeBalance) {
        return {
          status: 'error',
          message:
            'No se encontró el balance correspondiente a la variación seleccionada',
          failedAt: 'relation_balance_match',
        };
      }
      // //for smt-api
      // const credentials = await this.completeCreateSmtApiAccount(
      //   user,
      //   createOrderDto,
      //   challengeBalance.balance,
      //   relation,
      // );
      // for brokeret-api

      const credentials = await this.createBrokeretApiAccount(
        user,
        createOrderDto,
        challengeBalance.balance,
      );
      // Create broker account and challenge using the separated function
      const challengeRes = await this.createBrokerAndChallenge(
        credentials,
        user,
        relation,
      );

      if (!challengeRes.data) {
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
          to: user.email,
          subject: 'Challenge is ready to use!',
          template: 'challenge-credentials',
          context: {
            email: user.email,
            challenge_type: relation.plan.name,
            Account_size: challengeBalance.balance,
            login_details: {
              login: challenge.brokerAccount.login,
              password: challenge.brokerAccount.password,
              server: challenge.brokerAccount.server,
              platform: challenge.brokerAccount.platform,
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

  async createBrokerAndChallenge(
    credentials: any,
    user: any,
    relation: ChallengeRelation,
  ): Promise<ServiceResult<Challenge>> {
    try {
      // broker account creation
      let brokerAccount;
      try {
        brokerAccount = await this.brokerAccountsService.create(credentials);
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
        // challenge.relation.balances
        challenge.relation = relation;
        const riskParams = getBasicRiskParams(challenge);

        const challengeDetails =
          await this.challengesService.createChallengeDetails({
            challengeID: challenge.challengeID,
            rulesParams: riskParams,
          });
        challenge.details = challengeDetails;
        challenge.brokerAccount = brokerAccount;

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

  async createSmtApiChallenge(
    createSmtApiChallengeData: createSmtApiChallengeData,
  ): Promise<ServiceResult<createAccountResponse['userDataAccount']>> {
    const { user, createOrderDto, balance, url, leverage, platform } =
      createSmtApiChallengeData;

    try {
      // smt-api account creation
      const name = user.firstName || user.username;
      this.logger.log('Creating SMT API account with data:', {
        name,
        lastName: user.lastName || name,
        email: createOrderDto.user.email,
        balance: balance.toString(),
        leverage,
        phone: user.phone.replace('+', '') || '123456789',
        platform,
        url,
      });
      try {
        const response = await this.smtApiService.createAccount({
          name: name,
          lastName: user.lastName || name,
          email: createOrderDto.user.email,
          balance: Math.floor(balance).toString(),
          leverage,
          phone: user.phone.replace('+', '') || '123456789',
          platform,
          url,
        });
        return {
          status: response.success ? 'success' : 'error',
          message: response.message ?? 'Error desconocido',
          data: response.userDataAccount,
        };
      } catch (err) {
        return {
          status: 'error',
          message: 'Fallo al crear la cuenta en SMT API',
          failedAt: 'smt_account_create',
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
  async completeCreateSmtApiAccount(
    user: UserAccount,
    createOrderDto: CreateCompleteOrderDto,
    balance: number,
  ): Promise<any> {
    const url = 'https://access.metatrader5.com/terminal';
    const leverage = '100';
    const platform = 'mt5';
    this.logger.log('Creating SMT API challenge with data:', {
      user,
      createOrderDto,
    });
    const smtRes = await this.createSmtApiChallenge({
      user,
      createOrderDto,
      balance: balance,
      url,
      leverage,
      platform,
    });
    if (smtRes.status === 'error' || !smtRes.data) {
      return {
        status: 'error',
        message: smtRes.message || 'No se pudo crear el challenge',
        failedAt: smtRes.failedAt ?? 'challenge_create',
        details: smtRes.details,
      };
    }
    this.logger.log('SMT API challenge created:', smtRes.data);
    //map smtapi data to broker and challenge
    const credentials = createSmtApiResponseToBrokerAccount(smtRes.data);
    credentials.serverIp = url;
    credentials.platform = platform;
    return credentials;
  }
  async createBrokeretApiAccount(
    user: UserAccount,
    createOrderDto: CreateCompleteOrderDto,
    balance: number,
  ): Promise<CreateBrokerAccountDto> {
    const newUser = {
      
    }
    return;
  }
}
