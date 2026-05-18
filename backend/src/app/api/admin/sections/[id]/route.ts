import { NextResponse } from 'next/server';
import { requireSuperAdmin } from '../../../../_auth';
import { prisma } from '../../../../../../lib/prisma';
import { createAuditLog } from '../../_audit';
import { invalidateCache } from '@/lib/cache';

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const admin = await requireSuperAdmin(request);
    if (!admin) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    const section = await prisma.sectionContent.findUnique({ where: { id: params.id } });
    if (!section) return NextResponse.json({ message: 'Section not found' }, { status: 404 });
    return NextResponse.json(section);
  } catch (error) {
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const admin = await requireSuperAdmin(request);
    if (!admin) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    const existing = await prisma.sectionContent.findUnique({ where: { id: params.id } });
    if (!existing) return NextResponse.json({ message: 'Section not found' }, { status: 404 });

    const body = await request.json();
    const section = await prisma.sectionContent.update({
      where: { id: params.id },
      data: {
        title: body.title,
        subtitle: body.subtitle,
        content: body.content,
        settings: body.settings,
        sectionKey: body.sectionKey,
        sectionType: body.sectionType,
        order: body.order,
      },
    });

    await createAuditLog({
      userId: admin.id,
      userEmail: admin.email,
      action: 'UPDATE',
      entityType: 'SectionContent',
      entityId: section.id,
      entityName: `${section.sectionType} - ${section.title || ''}`,
      changes: { before: existing, after: section },
    });

    try { await invalidateCache('public:sections:*'); } catch {}

    return NextResponse.json(section);
  } catch (error) {
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const admin = await requireSuperAdmin(request);
    if (!admin) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    const section = await prisma.sectionContent.update({
      where: { id: params.id },
      data: { deletedAt: new Date() },
    });

    await createAuditLog({
      userId: admin.id,
      userEmail: admin.email,
      action: 'DELETE',
      entityType: 'SectionContent',
      entityId: section.id,
      entityName: `${section.sectionType} - ${section.title || ''}`,
    });

    try { await invalidateCache('public:sections:*'); } catch {}

    return NextResponse.json({ message: 'Section deleted' });
  } catch (error) {
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
