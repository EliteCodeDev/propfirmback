import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsNumberString, IsIn } from 'class-validator';
import { Transform } from 'class-transformer';

export class FindAllBrokerAccountsDto {
  @ApiPropertyOptional({ 
    description: 'Page number for pagination', 
    example: 1,
    default: 1 
  })
  @IsOptional()
  @IsNumberString()
  page?: string = '1';

  @ApiPropertyOptional({ 
    description: 'Number of items per page', 
    example: 10,
    default: 10 
  })
  @IsOptional()
  @IsNumberString()
  limit?: string = '10';

  @ApiPropertyOptional({ 
    description: 'Filter by usage status', 
    enum: ['true', 'false'],
    example: 'false' 
  })
  @IsOptional()
  @IsIn(['true', 'false'])
  isUsed?: string;

  @ApiPropertyOptional({ 
    description: 'Search by login (partial match)', 
    example: 'MT5_123' 
  })
  @IsOptional()
  @IsString()
  @Transform(({ value }) => value?.trim())
  login?: string;
}