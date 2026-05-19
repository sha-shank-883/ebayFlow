import { NextResponse } from 'next/server';
import { NotificationsService } from '@/modules/notifications/notifications.service';
import jwt from 'jsonwebtoken';

export const dynamic = 'force-dynamic';

const notificationsService = new NotificationsService();
const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-for-dev-only';

async function getAuth(request: Request) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader) throw new Error('Unauthorized');
  
  const token = authHeader.split(' ')[1];
  const decoded = jwt.verify(token, JWT_SECRET) as { workspaceId: string; userId: string };

  if (!decoded.workspaceId || !decoded.userId) {
    throw new Error('Invalid token session');
  }
  return decoded;
}

export async function GET(request: Request) {
  try {
    const { workspaceId, userId } = await getAuth(request);
    const notifications = await notificationsService.getNotifications(workspaceId, userId);
    return NextResponse.json(notifications);
  } catch (error: any) {
    return NextResponse.json(
      { message: error.message || 'Failed to fetch notifications' },
      { status: error.message === 'Unauthorized' ? 401 : 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const { workspaceId, userId } = await getAuth(request);
    const { id, all } = await request.json();

    if (all) {
      await notificationsService.markAllAsRead(workspaceId, userId);
    } else if (id) {
      await notificationsService.markAsRead(id, workspaceId);
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json(
      { message: error.message || 'Failed to update notifications' },
      { status: error.message === 'Unauthorized' ? 401 : 500 }
    );
  }
}
