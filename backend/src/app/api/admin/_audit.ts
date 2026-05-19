import { prisma } from '@/lib/prisma';

export async function createAuditLog(data: {
  userId?: string;
  userEmail?: string;
  action: string;
  entityType: string;
  entityId: string;
  entityName?: string;
  changes?: any;
  ipAddress?: string;
}) {
  try {
    await prisma.contentAudit.create({ data });
  } catch (error) {
    console.error('Failed to create audit log:', error);
  }
}
