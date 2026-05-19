import { NextResponse } from 'next/server';
import { AnalyticsService } from '@/modules/analytics/analytics.service';
import jwt from 'jsonwebtoken';
import { prisma } from '@/lib/prisma';

const analyticsService = new AnalyticsService();
const JWT_SECRET = process.env.JWT_SECRET;

async function getUserFromRequest(request: Request) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET!) as any;
    if (!decoded.workspaceId && decoded.userId) {
      const membership = await prisma.workspaceMember.findFirst({
        where: { userId: decoded.userId },
        orderBy: { createdAt: 'asc' },
      });
      if (membership) {
        decoded.workspaceId = membership.workspaceId;
      }
    }
    return decoded;
  } catch (e) {
    console.error('JWT verification failed:', e);
    return null;
  }
}

export async function GET(request: Request) {
  const user = await getUserFromRequest(request);
  if (!user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  if (!user.workspaceId) return NextResponse.json({ message: 'No workspace found' }, { status: 400 });

  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type') || 'dashboard';
  const days = searchParams.get('days') || '30';

  try {
    if (type === 'sales-chart') {
      const data = await analyticsService.getSalesChartData(user.workspaceId, parseInt(days));
      return NextResponse.json(data);
    }

    const stats = await analyticsService.getDashboardStats(user.workspaceId);
    return NextResponse.json(stats);
  } catch (error: any) {
    console.error('Analytics error:', error);
    return NextResponse.json({ message: error.message || 'Internal server error' }, { status: 500 });
  }
}
