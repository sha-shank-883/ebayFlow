import {
  Controller,
  Get,
  Post,
  Delete,
  Query,
  Param,
  UseGuards,
  Body,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/user.decorator';
import { EbayTradingService } from './ebay-trading.service';
import { EbayXmlUtils } from './ebay-xml.utils';

@ApiTags('ebay-trading')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('ebay/trading')
export class EbayTradingController {
  private getWorkspaceId(user: any): string {
    return user.workspaces[0]?.workspaceId;
  }

  private getTradingService(workspaceId: string): EbayTradingService {
    return new EbayTradingService(workspaceId);
  }

  @Get('my-selling')
  @ApiOperation({ summary: 'Get My eBay Selling data (active, sold, unsold, scheduled)' })
  async getMyeBaySelling(
    @CurrentUser() user: any,
    @Query('includeActive') includeActive?: string,
    @Query('includeSold') includeSold?: string,
    @Query('includeUnsold') includeUnsold?: string,
    @Query('includeScheduled') includeScheduled?: string,
    @Query('includeSummary') includeSummary?: string,
    @Query('entriesPerPage') entriesPerPage?: string,
    @Query('page') page?: string,
    @Query('durationInDays') durationInDays?: string,
    @Query('sort') sort?: string,
  ) {
    const service = this.getTradingService(this.getWorkspaceId(user));
    return service.getMyeBaySelling({
      includeActive: includeActive !== 'false',
      includeSold: includeSold === 'true',
      includeUnsold: includeUnsold === 'true',
      includeScheduled: includeScheduled === 'true',
      includeSummary: includeSummary === 'true',
      entriesPerPage: entriesPerPage ? parseInt(entriesPerPage) : undefined,
      page: page ? parseInt(page) : undefined,
      durationInDays: durationInDays ? parseInt(durationInDays) : undefined,
      sort,
    });
  }

  @Get('active-listings')
  @ApiOperation({ summary: 'Get all active listings with pagination' })
  async getActiveListings(
    @CurrentUser() user: any,
    @Query('entriesPerPage') entriesPerPage?: string,
    @Query('page') page?: string,
    @Query('sort') sort?: string,
  ) {
    const service = this.getTradingService(this.getWorkspaceId(user));
    const result = await service.getActiveListings({
      entriesPerPage: entriesPerPage ? parseInt(entriesPerPage) : undefined,
      page: page ? parseInt(page) : undefined,
      sort,
    });

    return {
      ...result,
      items: result.items.map((item: any) => EbayXmlUtils.parseItemData(item)),
    };
  }

  @Get('sold-listings')
  @ApiOperation({ summary: 'Get sold listings with pagination' })
  async getSoldListings(
    @CurrentUser() user: any,
    @Query('entriesPerPage') entriesPerPage?: string,
    @Query('page') page?: string,
    @Query('durationInDays') durationInDays?: string,
  ) {
    const service = this.getTradingService(this.getWorkspaceId(user));
    const result = await service.getSoldListings({
      entriesPerPage: entriesPerPage ? parseInt(entriesPerPage) : undefined,
      page: page ? parseInt(page) : undefined,
      durationInDays: durationInDays ? parseInt(durationInDays) : undefined,
    });

    return {
      ...result,
      items: result.items.map((item: any) => EbayXmlUtils.parseItemData(item)),
    };
  }

  @Get('unsold-listings')
  @ApiOperation({ summary: 'Get unsold listings with pagination' })
  async getUnsoldListings(
    @CurrentUser() user: any,
    @Query('entriesPerPage') entriesPerPage?: string,
    @Query('page') page?: string,
    @Query('durationInDays') durationInDays?: string,
  ) {
    const service = this.getTradingService(this.getWorkspaceId(user));
    const result = await service.getUnsoldListings({
      entriesPerPage: entriesPerPage ? parseInt(entriesPerPage) : undefined,
      page: page ? parseInt(page) : undefined,
      durationInDays: durationInDays ? parseInt(durationInDays) : undefined,
    });

    return {
      ...result,
      items: result.items.map((item: any) => EbayXmlUtils.parseItemData(item)),
    };
  }

  @Get('scheduled-listings')
  @ApiOperation({ summary: 'Get scheduled listings with pagination' })
  async getScheduledListings(
    @CurrentUser() user: any,
    @Query('entriesPerPage') entriesPerPage?: string,
    @Query('page') page?: string,
  ) {
    const service = this.getTradingService(this.getWorkspaceId(user));
    const result = await service.getScheduledListings({
      entriesPerPage: entriesPerPage ? parseInt(entriesPerPage) : undefined,
      page: page ? parseInt(page) : undefined,
    });

    return {
      ...result,
      items: result.items.map((item: any) => EbayXmlUtils.parseItemData(item)),
    };
  }

  @Get('selling-summary')
  @ApiOperation({ summary: 'Get selling summary statistics' })
  async getSellingSummary(@CurrentUser() user: any) {
    const service = this.getTradingService(this.getWorkspaceId(user));
    return service.getSellingSummary();
  }

  @Get('orders')
  @ApiOperation({ summary: 'Get orders with date filtering and pagination' })
  async getOrders(
    @CurrentUser() user: any,
    @Query('entriesPerPage') entriesPerPage?: string,
    @Query('page') page?: string,
    @Query('numberOfDays') numberOfDays?: string,
    @Query('statusFilter') statusFilter?: string,
  ) {
    const service = this.getTradingService(this.getWorkspaceId(user));
    const result = await service.getOrders({
      entriesPerPage: entriesPerPage ? parseInt(entriesPerPage) : undefined,
      page: page ? parseInt(page) : undefined,
      numberOfDays: numberOfDays ? parseInt(numberOfDays) : undefined,
      statusFilter,
    });

    const orders = result.OrderArray?.Order ?? [];
    const orderList = Array.isArray(orders) ? orders : orders ? [orders] : [];

    return {
      totalOrders: orderList.length,
      orders: orderList.map((order: any) => EbayXmlUtils.parseOrderData(order)),
      pagination: result.PaginationResult || null,
    };
  }

  @Get('orders/:orderId')
  @ApiOperation({ summary: 'Get a single order by ID' })
  async getOrder(@CurrentUser() user: any, @Param('orderId') orderId: string) {
    const service = this.getTradingService(this.getWorkspaceId(user));
    const result = await service.getOrder(orderId);
    const order = result.OrderArray?.Order;
    return EbayXmlUtils.parseOrderData(order);
  }

  @Get('item/:itemId')
  @ApiOperation({ summary: 'Get detailed item information by Item ID' })
  async getItem(
    @CurrentUser() user: any,
    @Param('itemId') itemId: string,
    @Query('includeWatchCount') includeWatchCount?: string,
    @Query('includeItemSpecifics') includeItemSpecifics?: string,
    @Query('includeTaxTable') includeTaxTable?: string,
  ) {
    const service = this.getTradingService(this.getWorkspaceId(user));
    const result = await service.getItem(itemId, {
      includeWatchCount: includeWatchCount === 'true',
      includeItemSpecifics: includeItemSpecifics !== 'false',
      includeTaxTable: includeTaxTable === 'true',
    });
    return EbayXmlUtils.parseItemData(result.Item);
  }

  @Get('item/sku/:sku')
  @ApiOperation({ summary: 'Get item by SKU' })
  async getItemBySku(@CurrentUser() user: any, @Param('sku') sku: string) {
    const service = this.getTradingService(this.getWorkspaceId(user));
    const result = await service.getItemBySku(sku);
    return EbayXmlUtils.parseItemData(result.Item);
  }

  @Get('seller-listings')
  @ApiOperation({ summary: 'Get all seller listings (for power sellers)' })
  async getSellerListings(
    @CurrentUser() user: any,
    @Query('entriesPerPage') entriesPerPage?: string,
    @Query('page') page?: string,
    @Query('granularityLevel') granularityLevel?: string,
  ) {
    const service = this.getTradingService(this.getWorkspaceId(user));
    const result = await service.getSellerListings({
      entriesPerPage: entriesPerPage ? parseInt(entriesPerPage) : undefined,
      page: page ? parseInt(page) : undefined,
      granularityLevel,
    });

    return {
      ...result,
      items: result.items.map((item: any) => EbayXmlUtils.parseItemData(item)),
    };
  }

  @Get('seller-transactions')
  @ApiOperation({ summary: 'Get seller transactions' })
  async getSellerTransactions(
    @CurrentUser() user: any,
    @Query('entriesPerPage') entriesPerPage?: string,
    @Query('page') page?: string,
    @Query('numberOfDays') numberOfDays?: string,
  ) {
    const service = this.getTradingService(this.getWorkspaceId(user));
    return service.getSellerTransactions({
      entriesPerPage: entriesPerPage ? parseInt(entriesPerPage) : undefined,
      page: page ? parseInt(page) : undefined,
      numberOfDays: numberOfDays ? parseInt(numberOfDays) : undefined,
    });
  }

  @Get('item/:itemId/transactions')
  @ApiOperation({ summary: 'Get transactions for a specific item' })
  async getItemTransactions(
    @CurrentUser() user: any,
    @Param('itemId') itemId: string,
    @Query('numberOfDays') numberOfDays?: string,
  ) {
    const service = this.getTradingService(this.getWorkspaceId(user));
    return service.getItemTransactions(itemId, {
      numberOfDays: numberOfDays ? parseInt(numberOfDays) : undefined,
    });
  }

  @Post('add-item')
  @ApiOperation({ summary: 'Create a new listing via Trading API' })
  async addItem(@CurrentUser() user: any, @Body() itemData: any) {
    const service = this.getTradingService(this.getWorkspaceId(user));
    const result = await service.addItem(itemData);
    return {
      success: true,
      itemId: result.ItemID,
      fees: result.Fees?.Fee || [],
      startTime: result.StartTime,
      endTime: result.EndTime,
    };
  }

  @Post('add-fixed-price-item')
  @ApiOperation({ summary: 'Create a new fixed-price listing via Trading API' })
  async addFixedPriceItem(@CurrentUser() user: any, @Body() itemData: any) {
    const service = this.getTradingService(this.getWorkspaceId(user));
    const result = await service.addFixedPriceItem(itemData);
    return {
      success: true,
      itemId: result.ItemID,
      sku: result.SKU,
      fees: result.Fees?.Fee || [],
      startTime: result.StartTime,
      endTime: result.EndTime,
    };
  }

  @Post('revise-item/:itemId')
  @ApiOperation({ summary: 'Revise an existing listing' })
  async reviseItem(
    @CurrentUser() user: any,
    @Param('itemId') itemId: string,
    @Body() revisions: any,
  ) {
    const service = this.getTradingService(this.getWorkspaceId(user));
    const result = await service.reviseItem(itemId, revisions);
    return {
      success: true,
      itemId: result.ItemID,
      startTime: result.StartTime,
      endTime: result.EndTime,
    };
  }

  @Post('revise-quantity')
  @ApiOperation({ summary: 'Revise quantity for a fixed-price listing' })
  async reviseFixedPriceQuantity(@CurrentUser() user: any, @Body() data: {
    itemId: string;
    sku: string;
    quantity: number;
  }) {
    const service = this.getTradingService(this.getWorkspaceId(user));
    return service.reviseFixedPriceQuantity(data.itemId, data.sku, data.quantity);
  }

  @Delete('end-item/:itemId')
  @ApiOperation({ summary: 'End a listing' })
  async endItem(
    @CurrentUser() user: any,
    @Param('itemId') itemId: string,
    @Query('reason') reason?: string,
  ) {
    const service = this.getTradingService(this.getWorkspaceId(user));
    return service.endItem(itemId, reason);
  }

  @Delete('end-items')
  @ApiOperation({ summary: 'End multiple listings at once' })
  async endItems(
    @CurrentUser() user: any,
    @Body('itemIds') itemIds: string[],
    @Query('reason') reason?: string,
  ) {
    if (!itemIds || !Array.isArray(itemIds)) {
      throw new BadRequestException('itemIds array is required');
    }
    const service = this.getTradingService(this.getWorkspaceId(user));
    return service.endItems(itemIds, reason);
  }

  @Post('relist-item/:itemId')
  @ApiOperation({ summary: 'Relist an ended item' })
  async relistItem(@CurrentUser() user: any, @Param('itemId') itemId: string) {
    const service = this.getTradingService(this.getWorkspaceId(user));
    const result = await service.relistItem(itemId);
    return {
      success: true,
      itemId: result.ItemID,
      startTime: result.StartTime,
      endTime: result.EndTime,
    };
  }

  @Post('verify-item')
  @ApiOperation({ summary: 'Verify an item before adding (test pricing/fees)' })
  async verifyAddItem(@CurrentUser() user: any, @Body() itemData: any) {
    const service = this.getTradingService(this.getWorkspaceId(user));
    const result = await service.verifyAddItem(itemData);
    return {
      fees: result.Fees?.Fee || [],
      discountReason: result.DiscountReason,
    };
  }

  @Get('categories')
  @ApiOperation({ summary: 'Get eBay category hierarchy' })
  async getCategories(
    @CurrentUser() user: any,
    @Query('categoryId') categoryId?: string,
    @Query('levelLimit') levelLimit?: string,
    @Query('viewAllNodes') viewAllNodes?: string,
  ) {
    const service = this.getTradingService(this.getWorkspaceId(user));
    return service.getCategories({
      categoryId,
      levelLimit: levelLimit ? parseInt(levelLimit) : undefined,
      viewAllNodes: viewAllNodes === 'true',
    });
  }

  @Get('user')
  @ApiOperation({ summary: 'Get user account details' })
  async getUserDetails(@CurrentUser() user: any) {
    const service = this.getTradingService(this.getWorkspaceId(user));
    return service.getUserDetails();
  }

  @Get('account-summary')
  @ApiOperation({ summary: 'Get account summary/invoice data' })
  async getAccountSummary(@CurrentUser() user: any) {
    const service = this.getTradingService(this.getWorkspaceId(user));
    return service.getAccountSummary();
  }

  @Post('complete-sale/:orderId')
  @ApiOperation({ summary: 'Mark an order as shipped/paid' })
  async completeSale(
    @CurrentUser() user: any,
    @Param('orderId') orderId: string,
    @Body() data: { shipped?: boolean; paid?: boolean },
  ) {
    const service = this.getTradingService(this.getWorkspaceId(user));
    return service.completeSale(orderId, data.shipped ?? true, data.paid ?? true);
  }

  @Get('official-time')
  @ApiOperation({ summary: 'Get eBay official server time' })
  async geteBayOfficialTime(@CurrentUser() user: any) {
    const service = this.getTradingService(this.getWorkspaceId(user));
    return service.geteBayOfficialTime();
  }

  @Post('sync-all')
  @ApiOperation({ summary: 'Sync all listings and orders from Trading API to database' })
  async syncAll(@CurrentUser() user: any) {
    const workspaceId = this.getWorkspaceId(user);
    const service = this.getTradingService(workspaceId);

    const activeListings = await service.getActiveListings({ entriesPerPage: 200 });
    const soldListings = await service.getSoldListings({ entriesPerPage: 200, durationInDays: 30 });
    const orders = await service.getOrders({ numberOfDays: 30, entriesPerPage: 200 });

    const parsedActive = activeListings.items.map((item: any) => EbayXmlUtils.parseItemData(item));
    const parsedSold = soldListings.items.map((item: any) => EbayXmlUtils.parseItemData(item));

    const orderArray = orders.OrderArray?.Order ?? [];
    const orderList = Array.isArray(orderArray) ? orderArray : orderArray ? [orderArray] : [];
    const parsedOrders = orderList.map((order: any) => EbayXmlUtils.parseOrderData(order));

    return {
      activeListings: {
        total: activeListings.totalEntries,
        items: parsedActive,
      },
      soldListings: {
        total: soldListings.totalEntries,
        items: parsedSold,
      },
      orders: {
        total: parsedOrders.length,
        items: parsedOrders,
      },
    };
  }
}
