import { PartialType } from '@nestjs/swagger';
import { CreateChallengeRelationDto } from '../create/create-challenge-relation.dto';

export class UpdateChallengeRelationDto extends PartialType(
  CreateChallengeRelationDto,
) {}
