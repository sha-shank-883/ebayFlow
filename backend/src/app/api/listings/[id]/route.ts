import { NextResponse } from 'next/server';
import { ListingsService } from '@/modules/listings/listings.service';
import { getAuthenticatedUser, unauthorized, noWorkspace } from '@/app/api/_auth';

export const dynamic = 'force-dynamic';

const listingsService = new ListingsService();

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const user = await getAuthenticatedUser(request);
  if (!user) return unauthorized();

  try {
    const listing = await listingsService.findOne(params.id, user.workspaceId);
    return NextResponse.json(listing);
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 404 });
  }
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const user = await getAuthenticatedUser(request);
  if (!user) return unauthorized();

  try {
    const body = await request.json();
    const listing = await listingsService.update(params.id, user.workspaceId, body);
    return NextResponse.json(listing);
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 400 });
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const user = await getAuthenticatedUser(request);
  if (!user) return unauthorized();

  try {
    await listingsService.remove(params.id, user.workspaceId);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 400 });
  }
}
