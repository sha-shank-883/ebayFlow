import { NextResponse } from 'next/server';
import { requireSuperAdmin } from '../../_auth';
import { prisma } from '../../../../lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const admin = await requireSuperAdmin(request);
    if (!admin) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const entityType = searchParams.get('entityType');
    const entityId = searchParams.get('entityId');
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const pageSize = Math.min(50, Math.max(1, parseInt(searchParams.get('pageSize') || '10')));
    const skip = (page - 1) * pageSize;

    const where: Record<string, unknown> = {};
    if (entityType) where.entityType = entityType;
    if (entityId) where.entityId = entityId;

    const [versions, total] = await Promise.all([
      prisma.contentVersion.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize,
      }),
      prisma.contentVersion.count({ where }),
    ]);

    return NextResponse.json({
      versions: versions.map((v) => ({
        id: v.id,
        versionNumber: v.version,
        createdAt: v.createdAt.toISOString(),
        author: v.createdBy || 'Unknown',
        notes: v.notes || '',
        content: v.content as Record<string, unknown>,
      })),
      total,
      page,
      pageSize,
    });
  } catch (error) {
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
