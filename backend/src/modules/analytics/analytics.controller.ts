// c:\Users\User\Desktop\seller\sellerflow-ai\backend\src\modules\analytics\analytics.controller.ts
import { Controller, Get, UseGuards, Query } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/user.decorator';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('analytics')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  private getWorkspaceId(user: any): string {
    return user.workspaces[0]?.workspaceId;
  }

  @Get('dashboard')
  @ApiOperation({ summary: 'Get high-level dashboard statistics' })
  getDashboardStats(@CurrentUser() user: any) {
    const workspaceId = this.getWorkspaceId(user);
    return this.analyticsService.getDashboardStats(workspaceId);
  }

  @Get('sales-chart')
  @ApiOperation({ summary: 'Get sales data for charting over time' })
  getSalesChartData(
    @CurrentUser() user: any,
    @Query('days') days?: string
  ) {
    const workspaceId = this.getWorkspaceId(user);
    return this.analyticsService.getSalesChartData(workspaceId, days ? parseInt(days) : 30);
  }
}
