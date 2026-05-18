import { NextResponse } from 'next/server';
import { ListingsService } from '../../../modules/listings/listings.service';
import { getAuthenticatedUser, unauthorized, noWorkspace } from '../_auth';

const listingsService = new ListingsService();

export async function POST(request: Request) {
  const user = await getAuthenticatedUser(request);
  if (!user) return unauthorized();
  if (!user.workspaceId) return noWorkspace();

  try {
    const body = await request.json();
    const { ids, action, data } = body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ message: 'ids array is required' }, { status: 400 });
    }

    switch (action) {
      case 'update': {
        const result = await listingsService.bulkUpdate(ids, user.workspaceId, data || {}, user.userId);
        return NextResponse.json(result);
      }

      case 'update-price': {
        if (data?.price === undefined) {
          return NextResponse.json({ message: 'price is required' }, { status: 400 });
        }
        const result = await listingsService.bulkUpdatePrice(ids, user.workspaceId, data.price, user.userId);
        return NextResponse.json(result);
      }

      case 'update-quantity': {
        if (data?.quantity === undefined) {
          return NextResponse.json({ message: 'quantity is required' }, { status: 400 });
        }
        const result = await listingsService.bulkUpdateQuantity(ids, user.workspaceId, data.quantity, user.userId);
        return NextResponse.json(result);
      }

      case 'update-title': {
        if (!data?.title) {
          return NextResponse.json({ message: 'title is required' }, { status: 400 });
        }
        const result = await listingsService.bulkUpdateTitle(ids, user.workspaceId, data.title, user.userId);
        return NextResponse.json(result);
      }

      case 'delete': {
        const result = await listingsService.bulkDelete(ids, user.workspaceId);
        return NextResponse.json(result);
      }

      default:
        return NextResponse.json({ message: 'Invalid action. Use: update, update-price, update-quantity, update-title, delete' }, { status: 400 });
    }
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
