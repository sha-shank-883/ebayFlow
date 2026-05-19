import { NextResponse } from 'next/server';
import { ListingsService } from '@/modules/listings/listings.service';
import { getAuthenticatedUser, unauthorized, noWorkspace } from '@/app/api/_auth';

export const dynamic = 'force-dynamic';

const listingsService = new ListingsService();

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const user = await getAuthenticatedUser(request);
  if (!user) return unauthorized();
  if (!user.workspaceId) return noWorkspace();

  try {
    const body = await request.json();
    const { sku, price, quantity, specifics, images } = body;
    if (price === undefined || quantity === undefined) {
      return NextResponse.json({ message: 'price and quantity are required' }, { status: 400 });
    }
    const result = await listingsService.addVariation(params.id, user.workspaceId, {
      sku, price, quantity, specifics, images,
    });
    return NextResponse.json(result, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 400 });
  }
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const user = await getAuthenticatedUser(request);
  if (!user) return unauthorized();
  if (!user.workspaceId) return noWorkspace();

  try {
    const body = await request.json();
    const { variationId, ...data } = body;
    if (!variationId) {
      return NextResponse.json({ message: 'variationId is required' }, { status: 400 });
    }
    const result = await listingsService.updateVariation(variationId, user.workspaceId, data);
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 400 });
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const user = await getAuthenticatedUser(request);
  if (!user) return unauthorized();
  if (!user.workspaceId) return noWorkspace();

  const { searchParams } = new URL(request.url);
  const variationId = searchParams.get('variationId');
  if (!variationId) {
    return NextResponse.json({ message: 'variationId query parameter is required' }, { status: 400 });
  }

  try {
    await listingsService.removeVariation(variationId, user.workspaceId);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 400 });
  }
}
