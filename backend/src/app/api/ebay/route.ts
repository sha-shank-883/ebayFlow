import { NextResponse } from 'next/server';
import { EbayService } from '@/modules/ebay/ebay.service';
import { getAuthenticatedUser, unauthorized, noWorkspace } from '@/app/api/_auth';

export const dynamic = 'force-dynamic';

const ebayService = new EbayService();

export async function GET(request: Request) {
  const user = await getAuthenticatedUser(request);
  if (!user) return unauthorized();
  if (!user.workspaceId) return noWorkspace();

  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action');

  try {
    if (action === 'auth-url') {
      const result = await ebayService.generateAuthUrl(user.workspaceId);
      return NextResponse.json(result);
    }

    if (action === 'accounts') {
      const accounts = await ebayService.getConnectedAccounts(user.workspaceId);
      return NextResponse.json(accounts);
    }

    return NextResponse.json({ message: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const user = await getAuthenticatedUser(request);
  if (!user) return unauthorized();
  if (!user.workspaceId) return noWorkspace();

  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action');
  const accountId = searchParams.get('accountId');

  try {
    if (action === 'sync' && accountId) {
      const result = await ebayService.syncListings(user.workspaceId, accountId);
      return NextResponse.json(result);
    }

    if (action === 'sync-orders' && accountId) {
      const result = await ebayService.syncOrders(user.workspaceId, accountId);
      return NextResponse.json(result);
    }

    return NextResponse.json({ message: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
