import { ApiProperty } from '@nestjs/swagger';
import { IsUUID, IsNotEmpty, IsOptional } from 'class-validator';

export class CreateChallengeRelationDto {
  @ApiProperty({ description: 'Plan ID' })
  @IsNotEmpty()
  @IsUUID()
  planID: string;
  @ApiProperty({ description: 'Category ID' })
  @IsUUID()
  @IsOptional()
  categoryID?: string;
}
