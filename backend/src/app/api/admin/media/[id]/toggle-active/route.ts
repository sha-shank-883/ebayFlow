import { NextResponse } from 'next/server';
import { requireSuperAdmin } from '@/app/api/_auth';
import { prisma } from '@/lib/prisma';

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const admin = await requireSuperAdmin(request);
    if (!admin) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    const media = await prisma.mediaAsset.findUnique({ where: { id: params.id } });
    if (!media) return NextResponse.json({ message: 'Media not found' }, { status: 404 });

    const updated = await prisma.mediaAsset.update({
      where: { id: params.id },
      data: { isActive: !media.isActive },
    });

    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
