// src/modules/auth/auth.service.ts

import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { ConfirmResetDto } from './dto/confirm-reset.dto';
import { UserAccount } from '../users/entities/user-account.entity';
import { BcryptUtil } from '../../common/utils/bcrypt.util';
import { MailerService } from '../mailer/mailer.service';
import { PasswordResetService } from './password-reset.service';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(UserAccount)
    private userRepo: Repository<UserAccount>,
    private readonly passwordResetService: PasswordResetService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private mailerService: MailerService,
  ) {}

  /** Registro SIN afiliado */
  async register(dto: RegisterDto) {
    const { username, email, password, firstName, lastName, phone } = dto;
    const lowerCaseEmail = email.toLowerCase().trim();

    // 1) evitar duplicados
    const exists = await this.userRepo.findOne({
      where: [{ email: lowerCaseEmail }, { username }],
    });
    if (exists) {
      throw new ConflictException(
        'User with this email or username already exists',
      );
    }

    // 2) hash de la contraseña
    const passwordHash = await BcryptUtil.hash(password);

    // 3) generar token de confirmacion
    const confirmationToken = this.jwtService.sign(
      { email: lowerCaseEmail },
      {
        secret: this.configService.get<string>('JWT_EMAIL_CONFIRM_SECRET'),
        expiresIn: this.configService.get<string>('JWT_EMAIL_CONFIRM_EXPIRES'),
      },
    );

    // 4) crear y guardar usuario
    const user = this.userRepo.create({
      username,
      email: lowerCaseEmail,
      passwordHash,
      firstName,
      lastName,
      phone,
      confirmationToken,
    });
    const saved = await this.userRepo.save(user);

    // 5) Enviar email de confirmación
    const baseUrl = this.configService.get<string>('BACKEND_URL');
    const confirmationLink = `${baseUrl}/api/auth/confirm-email?token=${confirmationToken}`;

    await this.mailerService.sendMail({
      to: saved.email,
      subject: 'Confirm your email address',
      template: 'confirm-email',
      context: {
        name: saved.firstName,
        link: confirmationLink,
      },
    });

    // 6) generar tokens y devolver
    const tokens = this.generateTokens(saved);
    return {
      message:
        'User registered successfully. Please check your email to confirm your account.',
      user: this.excludePassword(saved),
      ...tokens,
    };
  }

  /** Login */
  async login(dto: LoginDto) {
    const { email, password } = dto;
    const lowerCaseEmail = email.toLowerCase().trim();
    const user = await this.userRepo.findOne({
      where: { email: lowerCaseEmail },
      relations: ['userRoles', 'userRoles.role'],
    });
    if (!user || !(await BcryptUtil.compare(password, user.passwordHash))) {
      throw new UnauthorizedException('Invalid credentials');
    }
    if (user.isBlocked) {
      throw new UnauthorizedException('Account is blocked');
    }
    if (!user.isConfirmed) {
      throw new UnauthorizedException('Please confirm your email before logging in');
    }
    return {
      user: this.excludePassword(user),
      ...this.generateTokens(user),
    };
  }

  /** Para Passport LocalStrategy */
  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.userRepo.findOne({ where: { email } });
    if (user && (await BcryptUtil.compare(password, user.passwordHash))) {
      const { passwordHash, confirmationToken, ...rest } = user;
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
    const lowerCaseEmail = dto.email.toLowerCase().trim();
    const user = await this.userRepo.findOne({ where: { email: lowerCaseEmail } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const { token } = await this.passwordResetService.createToken(user);

    const resetLink = `${this.configService.get<string>(
      'FRONTEND_URL',
    )}/reset-password?token=${token}`;

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

  /** Confirmar reset de contraseña */
  async confirmPasswordReset(dto: ConfirmResetDto) {
    const { token, password } = dto;

    const resetToken = await this.passwordResetService.findToken(token);
    if (!resetToken || new Date() > resetToken.expiresAt) {
      throw new UnauthorizedException('Invalid or expired token');
    }

    const user = await this.userRepo.findOne({
      where: { userID: resetToken.userId },
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const passwordHash = await BcryptUtil.hash(password);
    await this.userRepo.update(user.userID, { passwordHash });

    await this.passwordResetService.deleteToken(token);

    return { message: 'Password has been reset successfully' };
  }

  /** Confirmar email */
  async confirmEmail(token: string) {
    try {
      const payload = this.jwtService.verify(token, {
        secret: this.configService.get<string>('JWT_EMAIL_CONFIRM_SECRET'),
      });
      if (!payload.email) {
        throw new UnauthorizedException('Invalid token');
      }

      const lowerCaseEmail = payload.email.toLowerCase().trim();
      const user = await this.userRepo.findOne({
        where: { email: lowerCaseEmail },
      });

      if (!user || user.confirmationToken !== token) {
        throw new UnauthorizedException('Invalid or expired token');
      }

      await this.userRepo.update(user.userID, {
        isConfirmed: true,
        confirmationToken: null,
      });

      return { message: 'Email confirmed successfully' };
    } catch (error) {
      throw new UnauthorizedException('Invalid or expired token');
    }
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
      expiresIn:
        this.configService.get<string>('jwt.refreshExpiresIn') || '7d',
    });

    return { access_token: accessToken, refresh_token: refreshToken };
  }

  private excludePassword(user: UserAccount) {
    const { passwordHash, confirmationToken, ...rest } = user;
    return rest;
  }
}
