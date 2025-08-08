import { PartialType } from '@nestjs/swagger';
import { CreateRoleDto } from '../create/create-role.dto';

export class UpdateRoleDto extends PartialType(CreateRoleDto) {}
