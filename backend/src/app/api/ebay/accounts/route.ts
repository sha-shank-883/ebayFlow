import { NextResponse } from 'next/server';
import { EbayService } from '@/modules/ebay/ebay.service';
import { getAuthenticatedUser, unauthorized, noWorkspace } from '@/app/api/_auth';

export const dynamic = 'force-dynamic';

const ebayService = new EbayService();

export async function GET(request: Request) {
  const user = await getAuthenticatedUser(request);
  if (!user) return unauthorized();
  if (!user.workspaceId) return noWorkspace();

  try {
    const accounts = await ebayService.getConnectedAccounts(user.workspaceId);
    return NextResponse.json(accounts);
  } catch (error: any) {
    return NextResponse.json({ message: error.message || 'Failed to load eBay accounts' }, { status: 500 });
  }
}
