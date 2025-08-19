import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsUUID, IsDateString } from 'class-validator';

export class CreateChallengeDetailsDto {
  @ApiProperty({
    description: 'Challenge ID (UUID)',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  challengeID: string;

  @ApiProperty({
    description: 'Meta statistics data in JSON format',
    example: '{"balance": 10000, "equity": 9500}',
    required: false,
  })
  @IsOptional()
  @IsString()
  metaStats?: string;

  @ApiProperty({
    description: 'Positions data in JSON format',
    example: '{"openPositions": [], "closedPositions": []}',
    required: false,
  })
  @IsOptional()
  @IsString()
  positions?: string;

  @ApiProperty({
    description: 'Rules validation data in JSON format',
    example: '{"dailyDrawdown": {"status": "passed", "value": 0.05}}',
    required: false,
  })
  @IsOptional()
  @IsString()
  rulesValidation?: string;

  @ApiProperty({
    description: 'Rules parameters data in JSON format',
    example: '{"maxRisk": 0.1, "minProfit": 0.05}',
    required: false,
  })
  @IsOptional()
  @IsString()
  rulesParams?: string;

  @ApiProperty({
    description: 'Last update timestamp',
    example: '2024-01-15T10:30:00Z',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  lastUpdate?: Date;
}
