import { NextResponse } from 'next/server';
import { ListingsService } from '@/modules/listings/listings.service';
import { getAuthenticatedUser, unauthorized, noWorkspace } from '@/app/api/_auth';

const listingsService = new ListingsService();

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const user = await getAuthenticatedUser(request);
  if (!user) return unauthorized();
  if (!user.workspaceId) return noWorkspace();

  try {
    const body = await request.json();
    const { imageUrl, sortOrder } = body;
    if (!imageUrl) {
      return NextResponse.json({ message: 'imageUrl is required' }, { status: 400 });
    }
    const result = await listingsService.addImage(params.id, user.workspaceId, imageUrl, sortOrder);
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
  const imageId = searchParams.get('imageId');
  if (!imageId) {
    return NextResponse.json({ message: 'imageId query parameter is required' }, { status: 400 });
  }

  try {
    await listingsService.removeImage(imageId, user.workspaceId);
    return NextResponse.json({ success: true });
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
    const { imageIds } = body;
    if (!imageIds || !Array.isArray(imageIds)) {
      return NextResponse.json({ message: 'imageIds array is required' }, { status: 400 });
    }
    const result = await listingsService.reorderImages(params.id, user.workspaceId, imageIds);
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 400 });
  }
}
