import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength } from 'class-validator';

export class CreateChallengeStageDto {
  @ApiProperty({
    description: 'Name of the challenge stage',
    example: 'Phase 1',
    maxLength: 100,
  })
  @IsString()
  @MaxLength(100)
  name: string;
}
