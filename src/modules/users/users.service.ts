import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike, Brackets } from 'typeorm';
import { UserAccount } from './entities/user-account.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserQueryDto } from './dto/user-query.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(UserAccount)
    private userRepository: Repository<UserAccount>,
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
            .orWhere("COALESCE(user.firstName,'') || ' ' || COALESCE(user.lastName,'') ILIKE :pattern", { pattern });
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
      const existingUsername = await this.findByUsername(updateUserDto.username);
      if (existingUsername) {
        throw new ConflictException('Username already taken');
      }
    }

    if (updateUserDto.password) {
      updateUserDto.passwordHash = await bcrypt.hash(updateUserDto.password, 10);
      delete updateUserDto.password;
    }

    Object.assign(user, updateUserDto);
    user.updatedAt = new Date();

    return this.userRepository.save(user);
  }

  // 👇 Eliminado porque la entidad ya no tiene resetPasswordToken
  // async updateResetToken(id: string, resetToken: string): Promise<void> {
  //   await this.userRepository.update(id, { resetPasswordToken: resetToken });
  // }

  async remove(id: string): Promise<void> {
    const user = await this.findById(id);
    await this.userRepository.remove(user);
  }
}
