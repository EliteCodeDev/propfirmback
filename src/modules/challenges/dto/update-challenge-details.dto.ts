import { PartialType } from '@nestjs/swagger';
import { CreateChallengeDetailsDto } from './create-challenge-details.dto';
import { OmitType } from '@nestjs/swagger';

export class UpdateChallengeDetailsDto extends PartialType(
  OmitType(CreateChallengeDetailsDto, ['challengeID'] as const),
) {}