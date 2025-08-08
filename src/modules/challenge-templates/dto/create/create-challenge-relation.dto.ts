import { ApiProperty } from '@nestjs/swagger';
import { IsUUID, IsNotEmpty } from 'class-validator';

export class CreateChallengeRelationDto {
  @ApiProperty({ description: 'Category ID' })
  @IsNotEmpty()
  @IsUUID()
  subcategoryID: string;

  @ApiProperty({ description: 'Plan ID' })
  @IsNotEmpty()
  @IsUUID()
  planID: string;

  @ApiProperty({
    description: 'Balance ID',
    required: false,
  })
  @IsUUID()
  balanceID?: string;
}
