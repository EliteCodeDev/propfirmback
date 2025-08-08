import { PartialType } from '@nestjs/swagger';
import { CreatePermissionDto } from '../create/create-permission.dto';

export class UpdatePermissionDto extends PartialType(CreatePermissionDto) {}
