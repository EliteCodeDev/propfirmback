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
import { CompletePasswordResetDto } from './dto/complete-password-reset.dto';
import { UserAccount } from '../users/entities/user-account.entity';
import { BcryptUtil } from 'src/common/utils/bcrypt';
import { MailerService } from '../mailer/mailer.service';
import { PasswordResetService } from '../password-reset/password-reset.service';
import { Role } from '../rbac/entities/role.entity';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @InjectRepository(UserAccount)
    private userRepo: Repository<UserAccount>,
    @InjectRepository(Role)
    private roleRepo: Repository<Role>,

    private jwtService: JwtService,
    private configService: ConfigService,
    private mailerService: MailerService,
    private passwordResetService: PasswordResetService,
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

    // 2) hash the password
    const passwordHash = await BcryptUtil.hash(password);

    // 3) crear y guardar usuario
    // determinar rol por defecto
    let roleIdToAssign: Role | undefined = undefined;
    const firstUserSuperadmin = this.configService.get<boolean>(
      'app.firstUserSuperadmin',
    );
    const usersCount = await this.userRepo.count();
    // Si es el primer usuario y la flag está activa, lo promovemos a super_admin independientemente del seeding
    if (firstUserSuperadmin && usersCount === 0) {
      const superAdminRole = await this.roleRepo.findOne({
        where: { name: 'super_admin' },
      });
      roleIdToAssign = superAdminRole;
    } else {
      const defaultRole = await this.roleRepo.findOne({
        where: { name: 'user' },
      });
      roleIdToAssign = defaultRole;
    }

    const user = await this.userRepo.create({
      username,
      email,
      passwordHash,
      firstName,
      lastName,
      phone,
      role: roleIdToAssign,
    });
    const saved = await this.userRepo.save(user);

    // 4) Send welcome + confirmation email
    const confirmationToken = (await BcryptUtil.hash(saved.email)).replace(
      /\//g,
      '',
    );
    await this.userRepo.update(saved.userID, { confirmationToken });

    const confirmationLink = `${this.configService.get<string>(
      'app.clientUrl',
    )}/auth/confirm?token=${confirmationToken}`;

    await this.mailerService.sendMail({
      to: saved.email,
      subject: 'Verify your email address',
      template: 'verify-email',
      context: {
        name: saved.firstName,
        confirmationLink,
      },
    });

    // 5) generar tokens y devolver
    const tokens = this.generateTokens(saved);
    return {
      message: 'User registered successfully',
      user: this.excludePassword(saved),
      ...tokens,
      status: 201,
    };
  }

  /** Login */
  async login(dto: LoginDto) {
    const { email, password } = dto;

    const user = await this.userRepo.findOne({
      where: { email },
      relations: ['role'],
    });

    if (!user) {
      this.logger.warn(`Login failed for email: ${email} - User not found`);
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await BcryptUtil.compare(
      password,
      user.passwordHash,
    );
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
      const { passwordHash, confirmationToken, ...rest } = user; // ← quitamos resetPasswordToken
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
        relations: ['role'],
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

    await this.passwordResetService.create(user.email, resetToken);

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
    // Si prefieres { accessToken, refreshToken }, cambia nombres arriba y en el consumo.
  }

  private excludePassword(user: UserAccount) {
    const { passwordHash, confirmationToken, ...rest } = user; // ← quitamos resetPasswordToken
    return rest;
  }

  /** Confirmar email */
  async confirmEmail(token: string) {
    const user = await this.userRepo.findOne({
      where: { confirmationToken: token },
    });
    if (!user) throw new NotFoundException('Invalid confirmation token');

    await this.userRepo.update(user.userID, {
      isConfirmed: true,
      confirmationToken: null,
    });

    return { message: 'Email confirmed successfully' };
  }

  /** Completar reset de contraseña */
  async completePasswordReset(dto: CompletePasswordResetDto) {
    const { token, newPassword } = dto;

    const passwordReset = await this.passwordResetService.findOneByToken(token);
    if (!passwordReset)
      throw new NotFoundException('Invalid password reset token');

    // Optional expiration (1 hour)
    const tokenMaxAge = 60 * 60 * 1000;
    const isTokenExpired =
      new Date().getTime() - passwordReset.createdAt.getTime() > tokenMaxAge;

    if (isTokenExpired) {
      await this.passwordResetService.remove(passwordReset.id);
      throw new UnauthorizedException('Password reset token has expired');
    }

    const user = await this.userRepo.findOne({
      where: { email: passwordReset.email },
    });
    if (!user) throw new NotFoundException('User not found');

    const passwordHash = await BcryptUtil.hash(newPassword);
    await this.userRepo.update(user.userID, { passwordHash });
    await this.passwordResetService.remove(passwordReset.id);

    return { message: 'Password has been reset successfully' };
  }
}
