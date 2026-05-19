import { NextResponse } from 'next/server';
import { AnalyticsService } from '@/modules/analytics/analytics.service';
import jwt from 'jsonwebtoken';

export const dynamic = 'force-dynamic';

const analyticsService = new AnalyticsService();
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

export async function GET(request: Request) {
  try {
    const workspaceId = await getWorkspaceId(request);
    const overview = await analyticsService.getOverview(workspaceId);
    return NextResponse.json(overview);
  } catch (error: any) {
    return NextResponse.json(
      { message: error.message || 'Failed to fetch analytics' },
      { status: error.message === 'Unauthorized' ? 401 : 500 }
    );
  }
}
