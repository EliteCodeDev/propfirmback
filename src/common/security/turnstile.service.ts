import { Injectable } from '@nestjs/common';

@Injectable()
export class TurnstileService {
  private readonly verifyUrl = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';
  private get secret(): string {
    const key =
      process.env.SECRET_KEY_CLOUDFLARE;
    return key || '';
  }

  async verify(token: string, remoteip?: string): Promise<boolean> {
    try {
      if (!token || !this.secret) return false;

      const body = new URLSearchParams();
      body.set('secret', this.secret);
      body.set('response', token);
      if (remoteip) body.set('remoteip', remoteip);

      const res = await fetch(this.verifyUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body,
      });

      if (!res.ok) return false;
      const data = (await res.json()) as { success: boolean; 'error-codes'?: string[] };
      return !!data.success;
    } catch (e) {
      console.error('Turnstile verify error:', e);
      return false;
    }
  }
}
