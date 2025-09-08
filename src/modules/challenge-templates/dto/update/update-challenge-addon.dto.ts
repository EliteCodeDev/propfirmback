import { PartialType } from '@nestjs/mapped-types';
import { CreateChallegeAddonDto } from '../create/create-challenge-addo.dto';

export class UpdateChallengeAddonDto extends PartialType(CreateChallegeAddonDto) {}