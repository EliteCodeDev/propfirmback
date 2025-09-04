import {
  Injectable,
  NotFoundException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CustomerOrder } from './entities/customer-order.entity';
import { CreateOrderDto } from './dto/create-order.dto';
import { CreateCompleteOrderDto } from './dto/create-complete-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { MailerService } from '../mailer/mailer.service';
import { ChallengesService } from '../challenges/challenges.service';
import { ChallengeTemplatesService } from '../challenge-templates/services/challenge-templates.service';
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
} from 'src/common/utils/mappers/account-mapper';
import { UserAccount } from '../users/entities';
import { CreateBrokerAccountDto } from '../broker-accounts/dto/create-broker-account.dto';
import { CreationFazoClient } from '../data/brokeret-api/client/creation-fazo.client';
import { CreateAccountDto } from '../data/brokeret-api/dto/create-account.dto';
import { BrokeretApiClient } from '../data/brokeret-api/client/brokeret-api.client';
import { BufferService } from 'src/lib/buffer/buffer.service';
import { mapChallengeToAccount } from 'src/common/utils/mappers/account-mapper';

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);
  constructor(
    @InjectRepository(CustomerOrder)
    private orderRepository: Repository<CustomerOrder>,
    private mailerService: MailerService,
    private configService: ConfigService,
    @Inject(forwardRef(() => ChallengesService))
    private challengesService: ChallengesService,
    private challengeTemplatesService: ChallengeTemplatesService,
    private brokerAccountsService: BrokerAccountsService,
    private usersService: UsersService,
    private smtApiService: SmtApiClient,
    private creationFazoClient: CreationFazoClient,
    private brokeretApiClient: BrokeretApiClient,
    private bufferService: BufferService,
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
            message:
              'User Account created, not able to send credentials email ',
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
            message: 'Plan hasnt a relation',
            failedAt: 'relation_fetch',
          };
        }
      } catch (err) {
        return {
          status: 'error',
          message: 'Fallo al obtener la relación del plan',
          failedAt: 'relation_fetch_error',
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
        relation.groupName,
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

      // Cargar la nueva cuenta en el buffer para seguimiento
      try {
        this.logger.log('Cargando nueva cuenta en el buffer:', {
          challengeId: challenge.challengeID,
          login: challenge.brokerAccount.login,
        });

        const accountForBuffer = mapChallengeToAccount(challenge);

        await this.bufferService.upsertAccount(
          challenge.brokerAccount.login,
          (prev) => {
            if (prev) {
              // Si ya existe, actualizar con los nuevos datos del challenge
              this.logger.log(
                'Actualizando cuenta existente en buffer:',
                challenge.brokerAccount.login,
              );
              prev.challengeId = challenge.challengeID;
              prev.riskValidation = accountForBuffer.riskValidation;
              prev.lastUpdate = new Date();
              return prev;
            } else {
              // Nueva cuenta
              this.logger.log(
                'Agregando nueva cuenta al buffer:',
                challenge.brokerAccount.login,
              );
              return accountForBuffer;
            }
          },
        );

        this.logger.log('Cuenta cargada exitosamente en el buffer');
      } catch (bufferError) {
        this.logger.warn('Error al cargar cuenta en el buffer (no crítico):', {
          error: bufferError.message,
          challengeId: challenge.challengeID,
          login: challenge.brokerAccount.login,
        });
        // No retornamos error aquí porque el buffer es para seguimiento,
        // no es crítico para la creación de la orden
      }

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
        isConfirmed: true, 
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
    retryCount: number = 0,
  ): Promise<ServiceResult<Challenge>> {
    const maxRetries = 3;
    const retryDelay = 1000; // 1 second

    try {
      // broker account creation
      let brokerAccount;
      try {
        brokerAccount = await this.brokerAccountsService.create(credentials);
      } catch (err) {
        // Check if this is a login conflict error and we can retry
        if (
          err?.message?.includes('Login already exists') &&
          retryCount < maxRetries
        ) {
          this.logger.warn(
            `Login conflict detected, retrying broker account creation. Attempt ${retryCount + 2}/${maxRetries + 1}`,
            {
              login: credentials.login,
              attempt: retryCount + 1,
            },
          );

          // Wait before retrying
          await new Promise((resolve) =>
            setTimeout(resolve, retryDelay * (retryCount + 1)),
          );

          // Modify the login to make it unique
          const modifiedCredentials = {
            ...credentials,
            login: `${credentials.login}_${Date.now()}_${retryCount + 1}`,
          };

          return this.createBrokerAndChallenge(
            modifiedCredentials,
            user,
            relation,
            retryCount + 1,
          );
        }

        return {
          status: 'error',
          message:
            retryCount >= maxRetries
              ? `Fallo al crear la cuenta de bróker después de ${maxRetries + 1} intentos`
              : 'Fallo al crear la cuenta de bróker',
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
        this.logger.debug('CreateBrokerAndChallenge: riskParams', riskParams);
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
    groupName: string,
    retryCount: number = 0,
  ): Promise<CreateBrokerAccountDto> {
    const maxRetries = 3;
    const retryDelay = 1000; // 1 second

    try {
      this.logger.log('Iniciando creación de cuenta Brokeret:', {
        userId: user.userID,
        email: user.email,
        balance,
        attempt: retryCount + 1,
        brokeretConfig: {
          apiUrl: process.env.BROKERET_API_URL,
          creationApiUrl: process.env.BROKERET_CREATION_API_URL,
          hasApiKey: !!process.env.BROKERET_KEY,
          hasUserCreationApi: !!process.env.BROKERET_USER_CREATION_API,
          hasPassCreationApi: !!process.env.BROKERET_PASS_CREATION_API,
        },
      });

      // Generar contraseñas aleatorias para la cuenta
      const masterPassword = generateRandomPassword(8);
      const investorPassword = generateRandomPassword(8);

      // Extraer datos del usuario y billing para crear la cuenta
      const { billing } = createOrderDto.user;
      const fullName = `${billing.first_name} ${billing.last_name}`.trim();

      // Add timestamp to make name more unique to avoid duplicates
      const uniqueName =
        retryCount > 0
          ? `${fullName || user.username}_${Date.now()}`
          : fullName || user.username;

      // Crear el DTO para la API de Fazo
      const createAccountData: CreateAccountDto = {
        name: uniqueName,
        groupName: groupName || 'contest\\PG\\kbst\\contestphase1', // Grupo por defecto
        email: user.email,
        phone: billing.phone || user.phone || '+1234567890',
        country: billing.country || 'US',
        city: billing.city || 'Unknown',
        address:
          `${billing.address_1} ${billing.address_2 || ''}`.trim() || 'Unknown',
        balance: balance,
        mPassword: masterPassword,
        iPassword: investorPassword,
        leverage: 100, // Apalancamiento por defecto
      };

      // Llamar al cliente de creación Fazo
      const fazoResponse =
        await this.creationFazoClient.createAccount(createAccountData);

      this.logger.log('Brokeret API account created successfully:', {
        message: fazoResponse.message,
        data: fazoResponse.user,
        accountId: fazoResponse.user.accountid,
        balance: fazoResponse.user.balance,
      });

      // Realizar depósito inicial con fallback
      try {
        const depositData = {
          login: Number(fazoResponse.user.accountid),
          amount: balance,
          comment: 'Initial deposit for challenge account',
          payment_method: 'internal',
        };

        this.logger.log('Making initial deposit with brokeretApiClient:', {
          login: fazoResponse.user.accountid,
          amount: balance,
        });

        const depositResult =
          await this.brokeretApiClient.makeDeposit(depositData);

        this.logger.log(
          'Initial deposit completed successfully with brokeretApiClient:',
          {
            result: depositResult,
          },
        );
      } catch (brokeretError) {
        this.logger.warn(
          'brokeretApiClient.makeDeposit failed, trying fallback with creationFazoClient:',
          brokeretError.message,
        );

        try {
          // Adaptar los datos para el cliente Fazo
          const fazoDepositData = {
            accountId: fazoResponse.user.accountid,
            amount: balance,
            txnType: 0,
            description: 'Initial deposit for challenge account',
            comment: 'Fallback deposit via creationFazoClient',
          };

          this.logger.log(
            'Making initial deposit with creationFazoClient fallback:',
            {
              accountId: fazoResponse.user.accountid,
              amount: balance,
            },
          );

          const fazoDepositResult =
            await this.creationFazoClient.makeDeposit(fazoDepositData);

          this.logger.log(
            'Initial deposit completed successfully with creationFazoClient fallback:',
            {
              result: fazoDepositResult,
            },
          );
        } catch (fazoError) {
          this.logger.error(
            'Both brokeretApiClient and creationFazoClient makeDeposit failed:',
            {
              brokeretError: brokeretError.message,
              fazoError: fazoError.message,
            },
          );
          // this.logger.warn(
          //   'Continuing without initial deposit - balance will be handled separately',
          // );
          // No lanzamos error, continuamos con la creación de la cuenta
          // El balance se manejará por separado
        }
      }

      // Mapear la respuesta de Fazo a CreateBrokerAccountDto
      const brokerAccountDto: CreateBrokerAccountDto = {
        login: fazoResponse.user.accountid.toString(),
        password: masterPassword,
        server: process.env.NEXT_PUBLIC_SERVER,
        serverIp: 'server.com', // IP del servidor por defecto
        platform: 'MT5',
        isUsed: false,
        investorPass: investorPassword,
        innitialBalance: balance,
      };

      return brokerAccountDto;
    } catch (error) {
      this.logger.error('Error creating Brokeret API account:', {
        error: error.message,
        attempt: retryCount + 1,
        maxRetries,
      });

      // Check if this is a login conflict error and we can retry
      if (
        error.message.includes('Login already exists') ||
        error.message.includes('already exists') ||
        error.message.includes('duplicate')
      ) {
        if (retryCount < maxRetries) {
          this.logger.warn(
            `Retrying account creation due to duplicate login. Attempt ${retryCount + 2}/${maxRetries + 1}`,
          );

          // Wait before retrying
          await new Promise((resolve) =>
            setTimeout(resolve, retryDelay * (retryCount + 1)),
          );

          return this.createBrokeretApiAccount(
            user,
            createOrderDto,
            balance,
            groupName,
            retryCount + 1,
          );
        } else {
          throw new Error(
            `Failed to create Brokeret API account after ${maxRetries + 1} attempts: Login conflicts persist`,
          );
        }
      }

      throw new Error(
        `Failed to create Brokeret API account: ${error.message}`,
      );
    }
  }
}
