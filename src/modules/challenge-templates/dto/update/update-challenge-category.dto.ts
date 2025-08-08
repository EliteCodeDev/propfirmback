import { PartialType } from '@nestjs/swagger';
import { CreateChallengeCategoryDto } from '../create/create-challenge-category.dto';

export class UpdateChallengeCategoryDto extends PartialType(
  CreateChallengeCategoryDto,
) {}
