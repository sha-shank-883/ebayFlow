// backend/src/app/api/analytics/dashboard/route.ts
import { NextResponse } from 'next/server';
import { AnalyticsService } from '@/modules/analytics/analytics.service';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-for-dev-only';

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) throw new Error('Unauthorized');
    
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET) as { workspaceId: string };

    if (!decoded.workspaceId) {
      throw new Error('No workspace selected');
    }

    const analyticsService = new AnalyticsService(decoded.workspaceId);
    const stats = await analyticsService.getDashboardStats();
    
    return NextResponse.json(stats);
  } catch (error: any) {
    return NextResponse.json(
      { message: error.message || 'Failed to fetch analytics' },
      { status: 500 }
    );
  }
}
