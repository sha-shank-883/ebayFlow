// backend/src/app/api/inventory/[id]/route.ts
import { NextResponse } from 'next/server';
import { InventoryService } from '../../../modules/inventory/inventory.service';
import jwt from 'jsonwebtoken';

const inventoryService = new InventoryService();
const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-for-dev-only';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) throw new Error('Unauthorized');
    
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET) as { workspaceId: string };

    if (!decoded.workspaceId) {
      throw new Error('No workspace selected');
    }

    const listing = await inventoryService.getListing(decoded.workspaceId, params.id);
    
    if (!listing) {
      return NextResponse.json({ message: 'Listing not found' }, { status: 404 });
    }

    return NextResponse.json(listing);
  } catch (error: any) {
    return NextResponse.json(
      { message: error.message || 'Failed to fetch listing' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) throw new Error('Unauthorized');
    
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET) as { workspaceId: string };

    if (!decoded.workspaceId) {
      throw new Error('No workspace selected');
    }

    const body = await request.json();
    const updatedListing = await inventoryService.updateListing(
      decoded.workspaceId,
      params.id,
      body
    );
    
    return NextResponse.json(updatedListing);
  } catch (error: any) {
    return NextResponse.json(
      { message: error.message || 'Failed to update listing' },
      { status: 500 }
    );
  }
}
