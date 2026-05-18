import { NextResponse } from 'next/server';
import { ListingsService } from '../../../../../../modules/listings/listings.service';
import { getAuthenticatedUser, unauthorized, noWorkspace } from '../../../_auth';

const listingsService = new ListingsService();

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const user = await getAuthenticatedUser(request);
  if (!user) return unauthorized();
  if (!user.workspaceId) return noWorkspace();

  try {
    const body = await request.json();
    const { key, value } = body;
    if (!key || !value) {
      return NextResponse.json({ message: 'key and value are required' }, { status: 400 });
    }
    const result = await listingsService.addSpecific(params.id, user.workspaceId, key, value);
    return NextResponse.json(result, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 400 });
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const user = await getAuthenticatedUser(request);
  if (!user) return unauthorized();
  if (!user.workspaceId) return noWorkspace();

  const { searchParams } = new URL(request.url);
  const key = searchParams.get('key');
  if (!key) {
    return NextResponse.json({ message: 'key query parameter is required' }, { status: 400 });
  }

  try {
    await listingsService.removeSpecific(params.id, user.workspaceId, key);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 400 });
  }
}
