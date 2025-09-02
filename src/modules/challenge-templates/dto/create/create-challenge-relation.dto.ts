import { ApiProperty } from '@nestjs/swagger';
import { IsUUID, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateChallengeRelationDto {
  @ApiProperty({ description: 'Plan ID' })
  @IsNotEmpty()
  @IsUUID()
  planID: string;
  @ApiProperty({ description: 'Category ID' })
  @IsUUID()
  @IsOptional()
  categoryID?: string;

  @ApiProperty({ description: 'Group Name' })
  @IsString()
  groupName: string;
}
