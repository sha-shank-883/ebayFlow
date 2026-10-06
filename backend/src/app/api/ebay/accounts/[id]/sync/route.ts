import { NextResponse } from 'next/server';
import { EbayService } from '@/modules/ebay/ebay.service';
import { getAuthenticatedUser, unauthorized, noWorkspace } from '@/app/api/_auth';

export const dynamic = 'force-dynamic';

const ebayService = new EbayService();

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const user = await getAuthenticatedUser(request);
  if (!user) return unauthorized();
  if (!user.workspaceId) return noWorkspace();

  try {
    const result = await ebayService.syncListings(user.workspaceId, params.id);
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ message: error.message || 'Sync failed' }, { status: 500 });
  }
}
