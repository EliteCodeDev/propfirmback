import { PartialType } from '@nestjs/swagger';
import { CreateChallengeDto } from '../create/create-challenge.dto';

export class UpdateChallengeDto extends PartialType(CreateChallengeDto) {}
