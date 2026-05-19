import { NextResponse } from 'next/server';
import { EbayService } from '@/modules/ebay/ebay.service';
import jwt from 'jsonwebtoken';

const ebayService = new EbayService();
const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-for-dev-only';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const workspaceId = searchParams.get('workspaceId');

    if (!workspaceId) {
      return NextResponse.json({ error: 'Workspace ID is required' }, { status: 400 });
    }

    const authHeader = request.headers.get('Authorization');
    if (!authHeader) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const token = authHeader.split(' ')[1];
    jwt.verify(token, JWT_SECRET);

    const { authUrl } = await ebayService.generateAuthUrl(workspaceId);
    return NextResponse.json({ url: authUrl });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to generate connection URL' }, { status: 500 });
  }
}
