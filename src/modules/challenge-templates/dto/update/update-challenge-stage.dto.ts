import { PartialType } from '@nestjs/swagger';
import { CreateChallengeStageDto } from '../create/create-challenge-stage.dto';

export class UpdateChallengeStageDto extends PartialType(
  CreateChallengeStageDto,
) {}
