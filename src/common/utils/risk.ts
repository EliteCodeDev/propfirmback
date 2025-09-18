import { IsNumber, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class MaxMinBalance {
  maxBalance: number;
  minBalance: number;
}
export class AverageMetrics {
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  winRate: number;
  lossRate: number;
  averageProfit: number;
  averageLoss: number;

  constructor() {
    this.totalTrades = 0;
    this.winningTrades = 0;
    this.losingTrades = 0;
    this.winRate = 0;
    this.lossRate = 0;
    this.averageProfit = 0;
    this.averageLoss = 0;
  }
}
export class RiskParams {
  @ApiProperty({
    description: 'Profit target percentage',
    example: 5,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  profitTarget?: number;

  @ApiProperty({
    description: 'Daily drawdown percentage',
    example: 5,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  dailyDrawdown?: number;

  @ApiProperty({
    description: 'Maximum drawdown percentage',
    example: 10,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  maxDrawdown?: number;

  @ApiProperty({
    description: 'Loss per trade percentage',
    example: 0,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  lossPerTrade?: number;

  @ApiProperty({
    description: 'Trading days requirement',
    example: 3,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  tradingDays?: number;

  @ApiProperty({
    description: 'Inactive days limit',
    example: 0,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  inactiveDays?: number;
}
