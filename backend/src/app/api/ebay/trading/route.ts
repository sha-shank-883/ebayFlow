import { NextResponse } from 'next/server';
import { EbayTradingService } from '@/modules/ebay/ebay-trading.service';
import { EbayXmlUtils } from '@/modules/ebay/ebay-xml.utils';
import { getAuthenticatedUser, unauthorized } from '@/app/api/_auth';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const user = await getAuthenticatedUser(request);
  if (!user) return unauthorized();

  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action');

  try {
    const service = new EbayTradingService(user.workspaceId);

    switch (action) {
      case 'active-listings': {
        const result = await service.getActiveListings({
          entriesPerPage: parseInt(searchParams.get('entriesPerPage') || '100'),
          page: parseInt(searchParams.get('page') || '1'),
          sort: searchParams.get('sort') || undefined,
        });
        return NextResponse.json({
          ...result,
          items: result.items.map((item: any) => EbayXmlUtils.parseItemData(item)),
        });
      }

      case 'sold-listings': {
        const result = await service.getSoldListings({
          entriesPerPage: parseInt(searchParams.get('entriesPerPage') || '100'),
          page: parseInt(searchParams.get('page') || '1'),
          durationInDays: parseInt(searchParams.get('durationInDays') || '30'),
        });
        return NextResponse.json({
          ...result,
          items: result.items.map((item: any) => EbayXmlUtils.parseItemData(item)),
        });
      }

      case 'unsold-listings': {
        const result = await service.getUnsoldListings({
          entriesPerPage: parseInt(searchParams.get('entriesPerPage') || '100'),
          page: parseInt(searchParams.get('page') || '1'),
          durationInDays: parseInt(searchParams.get('durationInDays') || '30'),
        });
        return NextResponse.json({
          ...result,
          items: result.items.map((item: any) => EbayXmlUtils.parseItemData(item)),
        });
      }

      case 'scheduled-listings': {
        const result = await service.getScheduledListings({
          entriesPerPage: parseInt(searchParams.get('entriesPerPage') || '100'),
          page: parseInt(searchParams.get('page') || '1'),
        });
        return NextResponse.json({
          ...result,
          items: result.items.map((item: any) => EbayXmlUtils.parseItemData(item)),
        });
      }

      case 'selling-summary': {
        const result = await service.getSellingSummary();
        return NextResponse.json(result);
      }

      case 'orders': {
        const result = await service.getOrders({
          entriesPerPage: parseInt(searchParams.get('entriesPerPage') || '100'),
          page: parseInt(searchParams.get('page') || '1'),
          numberOfDays: parseInt(searchParams.get('numberOfDays') || '30'),
          statusFilter: searchParams.get('statusFilter') || undefined,
        });
        const orders = result.OrderArray?.Order ?? [];
        const orderList = Array.isArray(orders) ? orders : orders ? [orders] : [];
        return NextResponse.json({
          totalOrders: orderList.length,
          orders: orderList.map((o: any) => EbayXmlUtils.parseOrderData(o)),
          pagination: result.PaginationResult || null,
        });
      }

      case 'seller-listings': {
        const result = await service.getSellerListings({
          entriesPerPage: parseInt(searchParams.get('entriesPerPage') || '50'),
          page: parseInt(searchParams.get('page') || '1'),
        });
        return NextResponse.json({
          ...result,
          items: result.items.map((item: any) => EbayXmlUtils.parseItemData(item)),
        });
      }

      case 'categories': {
        const result = await service.getCategories({
          categoryId: searchParams.get('categoryId') || undefined,
          levelLimit: parseInt(searchParams.get('levelLimit') || '3'),
          viewAllNodes: searchParams.get('viewAllNodes') === 'true',
        });
        return NextResponse.json(result);
      }

      default:
        return NextResponse.json({ message: 'Invalid action. Use: active-listings, sold-listings, unsold-listings, scheduled-listings, selling-summary, orders, seller-listings, categories' }, { status: 400 });
    }
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const user = await getAuthenticatedUser(request);
  if (!user) return unauthorized();

  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action');

  try {
    const service = new EbayTradingService(user.workspaceId);
    const body = await request.json();

    switch (action) {
      case 'add-item': {
        const result = await service.addItem(body);
        return NextResponse.json({
          success: true,
          itemId: result.ItemID,
          fees: result.Fees?.Fee || [],
          startTime: result.StartTime,
          endTime: result.EndTime,
        });
      }

      case 'add-fixed-price': {
        const result = await service.addFixedPriceItem(body);
        return NextResponse.json({
          success: true,
          itemId: result.ItemID,
          sku: result.SKU,
          fees: result.Fees?.Fee || [],
          startTime: result.StartTime,
          endTime: result.EndTime,
        });
      }

      case 'revise-item': {
        const { itemId, ...revisions } = body;
        if (!itemId) return NextResponse.json({ message: 'itemId is required' }, { status: 400 });
        const result = await service.reviseItem(itemId, revisions);
        return NextResponse.json({
          success: true,
          itemId: result.ItemID,
          startTime: result.StartTime,
          endTime: result.EndTime,
        });
      }

      case 'end-item': {
        const { itemId, reason } = body;
        if (!itemId) return NextResponse.json({ message: 'itemId is required' }, { status: 400 });
        const result = await service.endItem(itemId, reason);
        return NextResponse.json({ success: true, ...result });
      }

      case 'end-items': {
        const { itemIds, reason } = body;
        if (!itemIds || !Array.isArray(itemIds)) {
          return NextResponse.json({ message: 'itemIds array is required' }, { status: 400 });
        }
        const result = await service.endItems(itemIds, reason);
        return NextResponse.json({ success: true, ...result });
      }

      case 'relist-item': {
        const { itemId } = body;
        if (!itemId) return NextResponse.json({ message: 'itemId is required' }, { status: 400 });
        const result = await service.relistItem(itemId);
        return NextResponse.json({
          success: true,
          itemId: result.ItemID,
          startTime: result.StartTime,
          endTime: result.EndTime,
        });
      }

      case 'complete-sale': {
        const { orderId, shipped, paid } = body;
        if (!orderId) return NextResponse.json({ message: 'orderId is required' }, { status: 400 });
        const result = await service.completeSale(orderId, shipped ?? true, paid ?? true);
        return NextResponse.json({ success: true, ...result });
      }

      case 'sync-all': {
        const activeListings = await service.getActiveListings({ entriesPerPage: 200 });
        const soldListings = await service.getSoldListings({ entriesPerPage: 200, durationInDays: 30 });
        const orders = await service.getOrders({ numberOfDays: 30, entriesPerPage: 200 });

        return NextResponse.json({
          activeListings: {
            total: activeListings.totalEntries,
            items: activeListings.items.map((item: any) => EbayXmlUtils.parseItemData(item)),
          },
          soldListings: {
            total: soldListings.totalEntries,
            items: soldListings.items.map((item: any) => EbayXmlUtils.parseItemData(item)),
          },
          orders: {
            total: orders.OrderArray?.Order ? (Array.isArray(orders.OrderArray.Order) ? orders.OrderArray.Order.length : 1) : 0,
          },
        });
      }

      default:
        return NextResponse.json({ message: 'Invalid action. Use: add-item, add-fixed-price, revise-item, end-item, end-items, relist-item, complete-sale, sync-all' }, { status: 400 });
    }
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
