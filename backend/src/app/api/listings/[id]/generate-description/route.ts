import { NextResponse } from 'next/server';
import { ListingsService } from '@/modules/listings/listings.service';
import jwt from 'jsonwebtoken';

const listingsService = new ListingsService();
const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-for-dev-only';

async function getWorkspaceId(request: Request) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader) throw new Error('Unauthorized');
  
  const token = authHeader.split(' ')[1];
  const decoded = jwt.verify(token, JWT_SECRET) as { workspaceId: string };

  if (!decoded.workspaceId) {
    throw new Error('No workspace selected');
  }
  return decoded.workspaceId;
}

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const workspaceId = await getWorkspaceId(request);
    const result = await listingsService.generateDescription(params.id, workspaceId);
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json(
      { message: error.message || 'Failed to generate description' },
      { status: error.message === 'Unauthorized' ? 401 : 500 }
    );
  }
}
