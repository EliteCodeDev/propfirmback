import { PartialType } from '@nestjs/swagger';
import { CreateStageRuleDto } from '../create/create-stage-rule.dto';

export class UpdateStageRuleDto extends PartialType(CreateStageRuleDto) {}
