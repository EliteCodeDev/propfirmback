import { PartialType } from '@nestjs/swagger';
import { CreateChallengePlanDto } from '../create/create-challenge-plan.dto';

export class UpdateChallengePlanDto extends PartialType(
  CreateChallengePlanDto,
) {}
