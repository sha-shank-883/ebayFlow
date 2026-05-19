import { NextResponse } from 'next/server';
import { requireSuperAdmin } from '@/app/api/_auth';
import { prisma } from '@/lib/prisma';
import { createAuditLog } from '@/app/api/admin/_audit';
import { unlink } from 'fs/promises';
import { join } from 'path';

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const admin = await requireSuperAdmin(request);
    if (!admin) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    const media = await prisma.mediaAsset.findUnique({ where: { id: params.id } });
    if (!media) return NextResponse.json({ message: 'Media not found' }, { status: 404 });

    // Soft delete
    await prisma.mediaAsset.update({
      where: { id: params.id },
      data: { deletedAt: new Date() },
    });

    // Also try to delete the physical file
    try {
      const filePath = join(process.cwd(), 'public', media.url.replace('/uploads/', ''));
      await unlink(filePath);
    } catch {
      // File might already be deleted
    }

    await createAuditLog({
      userId: admin.id,
      userEmail: admin.email,
      action: 'DELETE',
      entityType: 'MediaAsset',
      entityId: media.id,
      entityName: media.filename,
    });

    return NextResponse.json({ message: 'Media deleted' });
  } catch (error) {
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const admin = await requireSuperAdmin(request);
    if (!admin) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const media = await prisma.mediaAsset.update({
      where: { id: params.id },
      data: {
        alt: body.alt,
        category: body.category,
      },
    });

    return NextResponse.json(media);
  } catch (error) {
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
