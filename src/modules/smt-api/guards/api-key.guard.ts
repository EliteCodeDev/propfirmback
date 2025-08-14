import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Observable } from 'rxjs';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(private configService: ConfigService) {}

  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {

    const request = context.switchToHttp().getRequest();

    const api_key = request.headers['x-api-key'];

    if (!api_key) {
      return false;
    }

    const validApiKey = this.configService.get<string>('scrap.apiKey') || "FundedHero=2c87a99a-59f2-c57-962f-628ac0688c05-b228c21dccc-490e-b29b401-8f30c56621d-5fc4b8c61-d8cb7b4-44828df51-5f6507d9";
    
    if (api_key !== validApiKey) {
      console.log("Api key diferente", validApiKey)
      return false;
    }

    return true;
  }
}
