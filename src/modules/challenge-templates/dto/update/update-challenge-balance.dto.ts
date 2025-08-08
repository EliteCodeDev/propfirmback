import { PartialType } from '@nestjs/swagger';
import { CreateChallengeBalanceDto } from '../create/create-challenge-balance.dto';

export class UpdateChallengeBalanceDto extends PartialType(
  CreateChallengeBalanceDto,
) {}
