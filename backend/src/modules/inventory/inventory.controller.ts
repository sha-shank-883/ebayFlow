// c:\Users\User\Desktop\seller\sellerflow-ai\backend\src\modules\inventory\inventory.controller.ts
import { Controller, Get, Post, Body, Patch, Param, UseGuards, Query } from '@nestjs/common';
import { InventoryService } from './inventory.service';
import { UpdateStockDto } from './dto/update-stock.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/user.decorator';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('inventory')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('inventory')
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  private getWorkspaceId(user: any): string {
    return user.workspaces[0]?.workspaceId;
  }

  @Get()
  @ApiOperation({ summary: 'Get all inventory items' })
  findAll(
    @CurrentUser() user: any,
    @Query('skip') skip?: string,
    @Query('take') take?: string,
    @Query('search') search?: string,
  ) {
    const workspaceId = this.getWorkspaceId(user);
    return this.inventoryService.findAll(
      workspaceId,
      skip ? parseInt(skip) : 0,
      take ? parseInt(take) : 50,
      search,
    );
  }

  @Get('alerts')
  @ApiOperation({ summary: 'Get low stock alerts' })
  getLowStockAlerts(@CurrentUser() user: any) {
    const workspaceId = this.getWorkspaceId(user);
    return this.inventoryService.getLowStockAlerts(workspaceId);
  }

  @Patch(':id/stock')
  @ApiOperation({ summary: 'Update stock for an inventory item' })
  updateStock(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() dto: UpdateStockDto,
  ) {
    const workspaceId = this.getWorkspaceId(user);
    return this.inventoryService.updateStock(id, workspaceId, dto);
  }
}
