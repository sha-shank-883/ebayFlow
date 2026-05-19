import { NextResponse } from 'next/server';
import { ListingsService } from '@/modules/listings/listings.service';
import { getAuthenticatedUser, unauthorized, noWorkspace } from '@/app/api/_auth';

export const dynamic = 'force-dynamic';

const listingsService = new ListingsService();

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const user = await getAuthenticatedUser(request);
  if (!user) return unauthorized();
  if (!user.workspaceId) return noWorkspace();

  try {
    const revisions = await listingsService.getRevisions(params.id, user.workspaceId);
    return NextResponse.json(revisions);
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
