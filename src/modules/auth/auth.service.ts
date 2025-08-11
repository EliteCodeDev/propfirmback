// src/modules/auth/auth.service.ts

import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { UserAccount } from '../users/entities/user-account.entity';
import { BcryptUtil } from 'src/common/utils/bcrypt';
import { MailerService } from '../mailer/mailer.service';
@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @InjectRepository(UserAccount)
    private userRepo: Repository<UserAccount>,

    private jwtService: JwtService,
    private configService: ConfigService,
    private mailerService: MailerService,
  ) {}

  /** Registro SIN afiliado */
  async register(dto: RegisterDto) {
    const { username, email, password, firstName, lastName, phone } = dto;

    // 1) evitar duplicados
    const exists = await this.userRepo.findOne({
      where: [{ email }, { username }],
    });
    if (exists) {
      throw new ConflictException(
        'User with this email or username already exists',
      );
    }

    // 2) hash de la contraseña
    const passwordHash = await BcryptUtil.hash(password);

    // 3) crear y guardar usuario
    const user = this.userRepo.create({
      username,
      email,
      passwordHash,
      firstName,
      lastName,
      phone,
    });
    const saved = await this.userRepo.save(user);

    // 4) Enviar email de bienvenida
    await this.mailerService.sendMail({
      to: saved.email,
      subject: 'Welcome to Prop Firm',
      template: 'welcome',
      context: {
        name: saved.firstName,
      },
    });

    // 5) generar tokens y devolver
    const tokens = this.generateTokens(saved);
    return {
      message: 'User registered successfully',
      user: this.excludePassword(saved),
      ...tokens,
    };
  }

  /** Login */
  async login(dto: LoginDto) {
    const { email, password } = dto;
    const user = await this.userRepo.findOne({
      where: { email },
      relations: ['userRoles', 'userRoles.role'],
    });
    
    if (!user) {
      this.logger.warn(`Login failed for email: ${email} - User not found`);
      throw new UnauthorizedException('Invalid credentials');
    }
    
    const isPasswordValid = await BcryptUtil.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      this.logger.warn(`Login failed for email: ${email} - Invalid password`);
      throw new UnauthorizedException('Invalid credentials');
    }
    
    if (user.isBlocked) {
      throw new UnauthorizedException('Account is blocked');
    }
    
    this.logger.log(`Login successful for email: ${email}`);
    return {
      user: this.excludePassword(user),
      ...this.generateTokens(user),
    };
  }

  /** Para Passport LocalStrategy */
  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.userRepo.findOne({ where: { email } });
    if (user && (await BcryptUtil.compare(password, user.passwordHash))) {
      const { passwordHash, resetPasswordToken, confirmationToken, ...rest } =
        user;
      return rest;
    }
    return null;
  }

  /** Refresh token */
  async refreshToken(dto: RefreshTokenDto) {
    try {
      const payload = this.jwtService.verify(dto.refreshToken, {
        secret: this.configService.get<string>('jwt.refreshSecret'),
      });
      const user = await this.userRepo.findOne({
        where: { userID: payload.sub },
        relations: ['userRoles', 'userRoles.role'],
      });
      if (!user) throw new UnauthorizedException('User not found');
      return this.generateTokens(user);
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  /** Solicitar reset de contraseña */
  async requestPasswordReset(dto: ResetPasswordDto) {
    const user = await this.userRepo.findOne({ where: { email: dto.email } });
    if (!user) throw new NotFoundException('User not found');
    const resetToken = this.jwtService.sign(
      { email: user.email, sub: user.userID },
      { expiresIn: '1h' },
    );
    await this.userRepo.update(user.userID, { resetPasswordToken: resetToken });

    // Enviar email con el link de reseteo
    const resetLink = `${this.configService.get<string>(
      'app.clientUrl',
    )}/reset-password?token=${resetToken}`;

    await this.mailerService.sendMail({
      to: user.email,
      subject: 'Password Reset Request',
      template: 'reset-password',
      context: {
        name: user.firstName,
        link: resetLink,
      },
    });

    return { message: 'Password reset email sent' };
  }

  /* — Helpers privados — */

  private generateTokens(user: UserAccount) {
    const payload = { email: user.email, sub: user.userID };

    // Access token
    const accessToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('jwt.secret'),
      expiresIn: this.configService.get<string>('jwt.expiresIn') || '15m',
    });

    // Refresh token
    const refreshToken = this.jwtService.sign(payload, {
      secret:
        this.configService.get<string>('jwt.refreshSecret') ||
        this.configService.get<string>('jwt.secret'),
      expiresIn: this.configService.get<string>('jwt.refreshExpiresIn') || '7d',
    });

    return { access_token: accessToken, refresh_token: refreshToken };
  }

  private excludePassword(user: UserAccount) {
    const { passwordHash, resetPasswordToken, confirmationToken, ...rest } =
      user;
    return rest;
  }
}
