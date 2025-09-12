import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike, Brackets } from 'typeorm';
import { UserAccount } from '../entities';
import { Address } from '../entities/address.entity';
import * as bcrypt from 'bcrypt';
import { Role } from 'src/modules/rbac/entities/role.entity';
import {
  CreateUserDto,
  UserQueryDto,
  UpdateUserDto,
  GenerateUserDto,
} from '../dto';
import { generateRandomPassword } from 'src/common/utils/randomPassword';
import { Inject, forwardRef } from '@nestjs/common';
import { MailerService } from 'src/modules/mailer/mailer.service';
import { ConfigService } from '@nestjs/config';
@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);
  constructor(
    @InjectRepository(UserAccount)
    private userRepository: Repository<UserAccount>,
    @InjectRepository(Address)
    private addressRepository: Repository<Address>,
    @InjectRepository(Role)
    private roleRepository: Repository<Role>,
    @Inject(forwardRef(() => MailerService))
    private mailerService: MailerService,
    private configService: ConfigService,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<UserAccount> {
    const existingUser = await this.findByEmail(createUserDto.email);
    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    const existingUsername = await this.findByUsername(createUserDto.username);
    if (existingUsername) {
      throw new ConflictException('Username already taken');
    }

    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);

    const user = this.userRepository.create({
      ...createUserDto,
      passwordHash: hashedPassword,
    });

    // Si viene roleId válido, asignamos ese rol; si no, intentamos por defecto 'user'
    try {
      const targetRole = createUserDto.roleId
        ? await this.roleRepository.findOne({
            where: { roleID: createUserDto.roleId },
          })
        : await this.roleRepository.findOne({ where: { name: 'user' } });
      if (targetRole) {
        user.role = targetRole;
      }
    } catch {
      // ignorar si no se encuentra el rol para no bloquear la creación
    }

    return this.userRepository.save(user);
  }

  async findAll(query: UserQueryDto) {
    const { page = 1, limit = 10, search, isVerified, isBlocked } = query;
    const skip = (page - 1) * limit;

    const qb = this.userRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.role', 'role');

    if (typeof isVerified === 'boolean') {
      qb.andWhere('user.isVerified = :isVerified', { isVerified });
    }
    if (typeof isBlocked === 'boolean') {
      qb.andWhere('user.isBlocked = :isBlocked', { isBlocked });
    }

    const trimmed = (search || '').trim();
    if (trimmed) {
      const pattern = `%${trimmed}%`;
      qb.andWhere(
        new Brackets((sub) => {
          sub
            .where('user.username ILIKE :pattern', { pattern })
            .orWhere('user.email ILIKE :pattern', { pattern })
            .orWhere('user.firstName ILIKE :pattern', { pattern })
            .orWhere('user.lastName ILIKE :pattern', { pattern })
            // Match concatenated firstName + ' ' + lastName
            .orWhere(
              "COALESCE(user.firstName,'') || ' ' || COALESCE(user.lastName,'') ILIKE :pattern",
              { pattern },
            );
        }),
      );
    }

    qb.orderBy('user.createdAt', 'DESC').skip(skip).take(limit);

    const [users, total] = await qb.getManyAndCount();

    return {
      data: users,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findById(id: string): Promise<UserAccount> {
    const user = await this.userRepository.findOne({
      where: { userID: id },
      relations: ['role', 'address'],
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async findByEmail(email: string): Promise<UserAccount | null> {
    return this.userRepository.findOne({
      where: { email },
      relations: ['role'],
    });
  }

  async findByUsername(username: string): Promise<UserAccount | null> {
    return this.userRepository.findOne({
      where: { username },
    });
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<UserAccount> {
    const user = await this.findById(id);

    if (updateUserDto.email && updateUserDto.email !== user.email) {
      const existingUser = await this.findByEmail(updateUserDto.email);
      if (existingUser) {
        throw new ConflictException('Email already in use');
      }
    }

    if (updateUserDto.username && updateUserDto.username !== user.username) {
      const existingUsername = await this.findByUsername(
        updateUserDto.username,
      );
      if (existingUsername) {
        throw new ConflictException('Username already taken');
      }
    }

    if (updateUserDto.password) {
      updateUserDto.passwordHash = await bcrypt.hash(
        updateUserDto.password,
        10,
      );
      delete updateUserDto.password;
    }

    Object.assign(user, updateUserDto);
    user.updatedAt = new Date();

    return this.userRepository.save(user);
  }

  async remove(id: string): Promise<void> {
    const user = await this.findById(id);
    await this.userRepository.remove(user);
  }

  async updateProfile(
    userId: string,
    dto: {
      firstName?: string;
      lastName?: string;
      phone?: string;
      country?: string | null;
      state?: string | null;
      city?: string | null;
      zipCode?: string | null;
      addressLine1?: string | null;
      addressLine2?: string | null;
    },
  ): Promise<UserAccount> {
    const user = await this.userRepository.findOne({
      where: { userID: userId },
      relations: ['address', 'role'],
    });
    if (!user) throw new NotFoundException('User not found');

    // Update simple user fields
    if (typeof dto.firstName !== 'undefined')
      user.firstName = dto.firstName ?? null;
    if (typeof dto.lastName !== 'undefined')
      user.lastName = dto.lastName ?? null;
    if (typeof dto.phone !== 'undefined')
      user.phone = dto.phone ?? (null as any);

    // Upsert address
    const hasAddressFields = [
      'country',
      'state',
      'city',
      'zipCode',
      'addressLine1',
      'addressLine2',
    ].some((k) => typeof (dto as any)[k] !== 'undefined');

    if (hasAddressFields) {
      let address = user.address;
      if (!address) {
        address = this.addressRepository.create({
          userID: user.userID,
          country: null,
          state: null,
          city: null,
          zipCode: null,
          addressLine1: null,
          addressLine2: null,
        });
      }
      if (typeof dto.country !== 'undefined')
        address.country = dto.country ?? null;
      if (typeof dto.state !== 'undefined') address.state = dto.state ?? null;
      if (typeof dto.city !== 'undefined') address.city = dto.city ?? null;
      if (typeof dto.zipCode !== 'undefined')
        address.zipCode = dto.zipCode ?? null;
      if (typeof dto.addressLine1 !== 'undefined')
        address.addressLine1 = dto.addressLine1 ?? null;
      if (typeof dto.addressLine2 !== 'undefined')
        address.addressLine2 = dto.addressLine2 ?? null;

      user.address = await this.addressRepository.save(address);
    }

    const saved = await this.userRepository.save(user);
    return this.findById(saved.userID);
  }
  async generate({ email, name, isConfirmed }: GenerateUserDto) {
    const user = await this.findByEmail(email);
    if (user) {
      throw new BadRequestException('User already exists');
    }
    const usernameBase = email.split('@')[0];
    let username = usernameBase;
    let suffix = 1;
    while (await this.findByUsername(username)) {
      username = `${usernameBase}${suffix++}`;
    }
    const password = generateRandomPassword();
    const userDto: CreateUserDto = {
      email,
      username,
      password,
      firstName: name,
    };
    if (isConfirmed) {
      userDto.isConfirmed = true;
    }
    const newUser = await this.create(userDto);
    try {
      this.logger.log(
        'Sending user credentials email with credentials to:',
        newUser.email,
      );
      await this.mailerService.sendMail({
        to: newUser.email,
        subject: 'Your account has been created',
        template: 'account-credentials',
        context: {
          email: newUser.email,
          password: password,
          username: newUser.username,
          landingUrl: this.configService.get<string>('app.clientUrl'),
        },
      });
    } catch (err) {
      throw new InternalServerErrorException({
        status: 'error',
        message: 'User created, unable to send credentials email',
        failedAt: 'email_send',
        details: err?.message ?? err,
      });
    }
    return { user: newUser, password };
  }
}
