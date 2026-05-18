// c:\Users\User\Desktop\seller\sellerflow-ai\backend\src\modules\orders\orders.controller.ts
import { Controller, Get, Post, Body, Patch, Param, UseGuards, Query } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { OrderQueryDto } from './dto/order-query.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/user.decorator';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('orders')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  private getWorkspaceId(user: any): string {
    return user.workspaces[0]?.workspaceId;
  }

  @Get()
  @ApiOperation({ summary: 'Get all orders for workspace' })
  findAll(@CurrentUser() user: any, @Query() query: OrderQueryDto) {
    const workspaceId = this.getWorkspaceId(user);
    return this.ordersService.findAll(workspaceId, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific order' })
  findOne(@CurrentUser() user: any, @Param('id') id: string) {
    const workspaceId = this.getWorkspaceId(user);
    return this.ordersService.findOne(id, workspaceId);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Update order status' })
  updateStatus(
    @CurrentUser() user: any, 
    @Param('id') id: string, 
    @Body('status') status: string
  ) {
    const workspaceId = this.getWorkspaceId(user);
    return this.ordersService.updateStatus(id, workspaceId, status);
  }

  @Post('sync')
  @ApiOperation({ summary: 'Trigger order sync from connected channels' })
  syncOrders(@CurrentUser() user: any) {
    const workspaceId = this.getWorkspaceId(user);
    return this.ordersService.syncOrders(workspaceId);
  }
}
