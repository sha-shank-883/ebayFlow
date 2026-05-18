import { NextResponse } from 'next/server';
import { requireSuperAdmin } from '../../../_auth';
import { prisma } from '../../../../../lib/prisma';

/**
 * GET /api/admin/versions
 * List versions for an entity.
 * Query params: entityType, entityId, page, limit
 */
export async function GET(request: Request) {
  try {
    const admin = await requireSuperAdmin(request);
    if (!admin) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const entityType = searchParams.get('entityType');
    const entityId = searchParams.get('entityId');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    if (!entityType || !entityId) {
      return NextResponse.json(
        { message: 'Missing required query params: entityType and entityId' },
        { status: 400 }
      );
    }

    const [versions, total] = await Promise.all([
      prisma.contentVersion.findMany({
        where: { entityType, entityId },
        orderBy: { version: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.contentVersion.count({ where: { entityType, entityId } }),
    ]);

    return NextResponse.json({ versions, total, page, totalPages: Math.ceil(total / limit) });
  } catch (error) {
    console.error('Error listing versions:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/admin/versions
 * Create a new version snapshot for an entity.
 * Body: entityType, entityId, content, notes?
 */
export async function POST(request: Request) {
  try {
    const admin = await requireSuperAdmin(request);
    if (!admin) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const { entityType, entityId, content, notes } = body;

    if (!entityType || !entityId || !content) {
      return NextResponse.json(
        { message: 'Missing required fields: entityType, entityId, content' },
        { status: 400 }
      );
    }

    const latestVersion = await prisma.contentVersion.findFirst({
      where: { entityType, entityId },
      orderBy: { version: 'desc' },
      select: { version: true },
    });

    const newVersion = await prisma.contentVersion.create({
      data: {
        entityType,
        entityId,
        version: (latestVersion?.version ?? 0) + 1,
        content,
        createdBy: admin.userId,
        notes,
      },
    });

    return NextResponse.json({ version: newVersion }, { status: 201 });
  } catch (error) {
    console.error('Error creating version:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
