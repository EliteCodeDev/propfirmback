import { Controller } from '@nestjs/common';
import { MtmApiService } from './mtm-api.service';

@Controller('mtm-api')
export class MtmApiController {
  constructor(private readonly mtmApiService: MtmApiService) {}
}
