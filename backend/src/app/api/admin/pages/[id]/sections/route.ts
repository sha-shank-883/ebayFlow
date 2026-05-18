import { NextResponse } from 'next/server';
import { requireSuperAdmin } from '../../../_auth';
import { prisma } from '../../../../../../lib/prisma';
import { createAuditLog } from '../../_audit';

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const admin = await requireSuperAdmin(request);
    if (!admin) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const includeInactive = searchParams.get('includeInactive') === 'true';

    const sections = await prisma.sectionContent.findMany({
      where: {
        pageId: params.id,
        ...(includeInactive ? { deletedAt: null } : { isActive: true, deletedAt: null }),
      },
      orderBy: { order: 'asc' },
    });

    return NextResponse.json(sections);
  } catch (error) {
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const admin = await requireSuperAdmin(request);
    if (!admin) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const maxOrder = await prisma.sectionContent.aggregate({
      where: { pageId: params.id },
      _max: { order: true },
    });

    const section = await prisma.sectionContent.create({
      data: {
        pageId: params.id,
        sectionKey: body.sectionKey,
        sectionType: body.sectionType,
        title: body.title || null,
        subtitle: body.subtitle || null,
        content: body.content || {},
        settings: body.settings || null,
        order: body.order ?? (maxOrder._max.order || 0) + 1,
      },
    });

    await createAuditLog({
      userId: admin.id,
      userEmail: admin.email,
      action: 'CREATE',
      entityType: 'SectionContent',
      entityId: section.id,
      entityName: `${body.sectionType} - ${body.title || ''}`,
      changes: { after: section },
    });

    return NextResponse.json(section, { status: 201 });
  } catch (error) {
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
