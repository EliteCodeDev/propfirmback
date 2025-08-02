import { IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AssignRoleDto {
  @ApiProperty()
  @IsUUID()
  userID: string;

  @ApiProperty()
  @IsUUID()
  roleId: string;
}
