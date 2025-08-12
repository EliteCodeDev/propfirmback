import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserAccount } from '../../users/entities/user-account.entity';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly configService: ConfigService,
    @InjectRepository(UserAccount)
    private readonly userRepository: Repository<UserAccount>,
  ) {
    // Leemos el secreto desde JWT_SECRET y lanzamos error si falta
    const secret = configService.get('JWT_SECRET') as string;
    if (!secret) {
      throw new Error('La variable de entorno JWT_SECRET no está definida');
    }

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secret,
    });
  }

  async validate(payload: any) {
    // payload.sub contiene el userID
    const user = await this.userRepository.findOne({
      where: { userID: payload.sub },
      relations: ['role', 'role.rolePermissions', 'role.rolePermissions.permission'],
    });
    if (!user) {
      throw new UnauthorizedException();
    }
    const permissions =
      user.role?.rolePermissions?.map((rp) => rp.permission?.name).filter(Boolean) || [];

    return {
      userID: payload.sub,
      email: user.email,
      username: user.username,
      roles: user.role?.name ? [user.role.name] : [],
      permissions,
      isVerified: user.isVerified,
    };
  }
}
