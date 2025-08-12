import { PartialType } from '@nestjs/swagger';
import { CreateRelationBalanceDto } from '../create/create-relation-balance.dto';

export class UpdateRelationBalanceDto extends PartialType(
  CreateRelationBalanceDto,
) {}