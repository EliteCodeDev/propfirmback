import { ApiProperty } from '@nestjs/swagger';
import { IsUUID, IsNotEmpty } from 'class-validator';

export class CreateChallengeRelationDto {
  @ApiProperty({ description: 'Plan ID' })
  @IsNotEmpty()
  @IsUUID()
  planID: string;
  @ApiProperty({ description: 'Category ID' })
  @IsUUID()
  categoryID: string;
}
