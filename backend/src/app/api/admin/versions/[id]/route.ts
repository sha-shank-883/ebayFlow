import { NextResponse } from 'next/server';
import { requireSuperAdmin } from '../../../../_auth';
import { prisma } from '../../../../../../lib/prisma';

/**
 * GET /api/admin/versions/[id]
 * Get specific version details.
 */
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const admin = await requireSuperAdmin(request);
    if (!admin) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    const version = await prisma.contentVersion.findUnique({
      where: { id: params.id },
    });

    if (!version) {
      return NextResponse.json({ message: 'Version not found' }, { status: 404 });
    }

    return NextResponse.json({ version });
  } catch (error) {
    console.error('Error fetching version:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/admin/versions/[id]
 * Restore entity to this version.
 * Creates a new version snapshot before restoring.
 * Body: content (the restored content to apply)
 */
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const admin = await requireSuperAdmin(request);
    if (!admin) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    const targetVersion = await prisma.contentVersion.findUnique({
      where: { id: params.id },
    });

    if (!targetVersion) {
      return NextResponse.json({ message: 'Version not found' }, { status: 404 });
    }

    const body = await request.json();
    const { content } = body;

    if (!content) {
      return NextResponse.json(
        { message: 'Missing required field: content' },
        { status: 400 }
      );
    }

    const result = await prisma.$transaction(async (tx) => {
      const latestVersion = await tx.contentVersion.findFirst({
        where: {
          entityType: targetVersion.entityType,
          entityId: targetVersion.entityId,
        },
        orderBy: { version: 'desc' },
        select: { version: true },
      });

      const restoreVersion = await tx.contentVersion.create({
        data: {
          entityType: targetVersion.entityType,
          entityId: targetVersion.entityId,
          version: (latestVersion?.version ?? 0) + 1,
          content,
          createdBy: admin.userId,
          notes: `Restored from version ${targetVersion.version}`,
        },
      });

      return restoreVersion;
    });

    return NextResponse.json({
      message: 'Entity restored successfully',
      version: result,
    });
  } catch (error) {
    console.error('Error restoring version:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
