import { ApiProperty } from '@nestjs/swagger';
import { IsUUID, IsOptional, IsInt, Min } from 'class-validator';

export class CreateRelationStageDto {
  @ApiProperty({
    description: 'Stage ID reference',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  stageID: string;

  @ApiProperty({
    description: 'Relation ID reference',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  relationID: string;

  @ApiProperty({
    description: 'Phase number for the relation stage',
    example: 1,
    required: false,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  numPhase?: number;
}
