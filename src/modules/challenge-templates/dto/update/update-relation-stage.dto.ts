import { PartialType } from '@nestjs/swagger';
import { CreateRelationStageDto } from '../create/create-relation-stage.dto';

export class UpdateRelationStageDto extends PartialType(
  CreateRelationStageDto,
) {}
