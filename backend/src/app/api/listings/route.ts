import { NextResponse } from 'next/server';
import { ListingsService } from '@/modules/listings/listings.service';
import { getAuthenticatedUser, unauthorized, noWorkspace } from '@/app/api/_auth';

const listingsService = new ListingsService();

export async function GET(request: Request) {
  const user = await getAuthenticatedUser(request);
  if (!user) return unauthorized();
  if (!user.workspaceId) return noWorkspace();

  const { searchParams } = new URL(request.url);
  const skip = parseInt(searchParams.get('skip') || '0');
  const take = parseInt(searchParams.get('take') || '50');
  const search = searchParams.get('search') || undefined;
  const status = searchParams.get('status') || undefined;
  const accountId = searchParams.get('accountId') || undefined;
  const sortBy = searchParams.get('sortBy') || 'createdAt';
  const sortOrder = (searchParams.get('sortOrder') || 'desc') as 'asc' | 'desc';
  const cursor = searchParams.get('cursor') || undefined;

  try {
    const result = await listingsService.findAll(user.workspaceId, {
      skip, take, search, status, accountId, sortBy, sortOrder, cursor,
    });
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const user = await getAuthenticatedUser(request);
  if (!user) return unauthorized();
  if (!user.workspaceId) return noWorkspace();

  try {
    const body = await request.json();
    const listing = await listingsService.create(user.workspaceId, body);
    return NextResponse.json(listing, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 400 });
  }
}
