// backend/src/modules/notifications/notifications.service.ts
import { prisma } from '../../lib/prisma';

export class NotificationsService {
  async getNotifications(workspaceId: string, userId: string) {
    return prisma.notification.findMany({
      where: {
        workspaceId,
        OR: [
          { userId },
          { userId: null }
        ]
      },
      orderBy: { createdAt: 'desc' },
      take: 20
    });
  }

  async markAsRead(id: string, workspaceId: string) {
    return prisma.notification.updateMany({
      where: { id, workspaceId },
      data: { isRead: true, readAt: new Date() }
    });
  }

  async markAllAsRead(workspaceId: string, userId: string) {
    return prisma.notification.updateMany({
      where: { 
        workspaceId, 
        userId,
        isRead: false 
      },
      data: { isRead: true, readAt: new Date() }
    });
  }

  async createNotification(data: { workspaceId: string; userId?: string; type: string; title: string; message: string; data?: any }) {
    return prisma.notification.create({
      data
    });
  }
}
