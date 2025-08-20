import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { TurnstileService } from './turnstile.service';

@Injectable()
export class TurnstileGuard implements CanActivate {
  constructor(private readonly turnstile: TurnstileService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const ctx = context.switchToHttp();
    const req = ctx.getRequest<Request & { headers: any }>();

    // Accept token from header or body for flexibility
    const token =
      (req.headers?.['cf-turnstile-response'] as string) ||
      (req.headers?.['x-turnstile-token'] as string) ||
      (req as any).body?.captchaToken ||
      (req as any).body?.turnstileToken;

    if (!token) {
      throw new UnauthorizedException('Captcha token missing');
    }

    const ip = (req.headers['cf-connecting-ip'] as string) || (req.headers['x-forwarded-for'] as string);
    const valid = await this.turnstile.verify(token, ip);
    if (!valid) {
      throw new ForbiddenException('Captcha verification failed');
    }

    return true;
  }
}
