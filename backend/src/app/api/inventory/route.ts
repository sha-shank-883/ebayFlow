import { NextResponse } from 'next/server';
import { InventoryService } from '../../../modules/inventory/inventory.service';
import { getAuthenticatedUser, unauthorized, noWorkspace } from '../_auth';

const inventoryService = new InventoryService();

export async function GET(request: Request) {
  const user = await getAuthenticatedUser(request);
  if (!user) return unauthorized();
  if (!user.workspaceId) return noWorkspace();

  const { searchParams } = new URL(request.url);
  const skip = searchParams.get('skip') || '0';
  const take = searchParams.get('take') || '50';
  const search = searchParams.get('search') || undefined;

  try {
    const result = await inventoryService.findAll(user.workspaceId, parseInt(skip), parseInt(take), search);
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
