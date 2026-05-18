// c:\Users\User\Desktop\seller\sellerflow-ai\backend\src\modules\admin\admin.controller.ts
import { Controller, Get, Patch, Param, UseGuards, Query } from '@nestjs/common';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('admin')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('SUPER_ADMIN')
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('stats')
  @ApiOperation({ summary: 'Get system-wide statistics (Super Admin)' })
  getSystemStats() {
    return this.adminService.getSystemStats();
  }

  @Get('users')
  @ApiOperation({ summary: 'Get all users in the system (Super Admin)' })
  getAllUsers(
    @Query('skip') skip?: string,
    @Query('take') take?: string,
  ) {
    return this.adminService.getAllUsers(
      skip ? parseInt(skip) : 0,
      take ? parseInt(take) : 50,
    );
  }

  @Get('workspaces')
  @ApiOperation({ summary: 'Get all workspaces in the system (Super Admin)' })
  getAllWorkspaces(
    @Query('skip') skip?: string,
    @Query('take') take?: string,
  ) {
    return this.adminService.getAllWorkspaces(
      skip ? parseInt(skip) : 0,
      take ? parseInt(take) : 50,
    );
  }

  @Patch('users/:id/toggle-status')
  @ApiOperation({ summary: 'Toggle user active status (Super Admin)' })
  toggleUserStatus(@Param('id') id: string) {
    return this.adminService.toggleUserStatus(id);
  }
}
