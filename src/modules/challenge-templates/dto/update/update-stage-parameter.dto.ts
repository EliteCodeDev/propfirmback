import { PartialType } from '@nestjs/swagger';
import { CreateStageParameterDto } from '../create/create-stage-parameter.dto';

export class UpdateStageParameterDto extends PartialType(
  CreateStageParameterDto,
) {}
