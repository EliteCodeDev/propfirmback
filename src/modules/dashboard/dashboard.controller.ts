import {
  Controller,
  Get,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';

@ApiTags('Dashboard')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('stats')
  @ApiOperation({ summary: 'Get dashboard statistics' })
  @ApiResponse({ status: 200, description: 'Dashboard statistics retrieved successfully' })
  async getStats() {
    return this.dashboardService.getStats();
  }

  @Get('analytics')
  @ApiOperation({ summary: 'Get dashboard analytics data' })
  @ApiResponse({ status: 200, description: 'Dashboard analytics retrieved successfully' })
  async getAnalytics() {
    return this.dashboardService.getAnalytics();
  }

  @Get('top-plans')
  @ApiOperation({ summary: 'Get top selling plans' })
  @ApiResponse({ status: 200, description: 'Top selling plans retrieved successfully' })
  async getTopPlans() {
    return this.dashboardService.getTopPlans();
  }

  @Get('overview')
  @ApiOperation({ summary: 'Get complete dashboard overview' })
  @ApiResponse({ status: 200, description: 'Dashboard overview retrieved successfully' })
  async getOverview() {
    return this.dashboardService.getOverview();
  }
}