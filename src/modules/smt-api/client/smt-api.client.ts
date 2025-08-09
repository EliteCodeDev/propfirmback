import { HttpService } from '@nestjs/axios';
import { Injectable, Inject } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { smtApiConfig } from 'src/config';

@Injectable()
export class SmtApiClient {
  constructor(
    private readonly httpService: HttpService,
    @Inject(smtApiConfig.KEY)
    private readonly config: ConfigType<typeof smtApiConfig>,
  ) {}
}
