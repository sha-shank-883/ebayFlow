import { NextResponse } from 'next/server';
import { requireSuperAdmin } from '@/app/api/_auth';
import { prisma } from '@/lib/prisma';
import { createAuditLog } from '@/app/api/admin/_audit';

export async function POST(request: Request, { params }: { params: { id: string; versionId: string } }) {
  try {
    const admin = await requireSuperAdmin(request);
    if (!admin) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    const version = await prisma.contentVersion.findUnique({
      where: { id: params.versionId },
    });

    if (!version || version.entityId !== params.id || version.entityType !== 'blog') {
      return NextResponse.json({ message: 'Version not found' }, { status: 404 });
    }

    const content = version.content as Record<string, unknown>;

    const restored = await prisma.blogPost.update({
      where: { id: params.id },
      data: {
        title: (content.title as string) || '',
        slug: (content.slug as string) || '',
        excerpt: (content.excerpt as string) || '',
        content: (content.content as string) || '',
        status: (content.status as string) || 'DRAFT',
        metaTitle: (content.metaTitle as string) || null,
        metaDescription: (content.metaDescription as string) || null,
      },
    });

    await createAuditLog({
      userId: admin.id,
      userEmail: admin.email,
      action: 'RESTORE',
      entityType: 'BlogPost',
      entityId: restored.id,
      entityName: restored.title,
      changes: { versionId: params.versionId, versionNumber: version.version },
    });

    return NextResponse.json(restored);
  } catch (error) {
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
