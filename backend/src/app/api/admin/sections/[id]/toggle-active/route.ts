import { NextResponse } from 'next/server';
import { requireSuperAdmin } from '../../../../_auth';
import { prisma } from '../../../../../../lib/prisma';
import { createAuditLog } from '../../_audit';

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const admin = await requireSuperAdmin(request);
    if (!admin) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    const section = await prisma.sectionContent.findUnique({ where: { id: params.id } });
    if (!section) return NextResponse.json({ message: 'Section not found' }, { status: 404 });

    const updated = await prisma.sectionContent.update({
      where: { id: params.id },
      data: { isActive: !section.isActive },
    });

    await createAuditLog({
      userId: admin.id,
      userEmail: admin.email,
      action: 'TOGGLE',
      entityType: 'SectionContent',
      entityId: section.id,
      entityName: `${section.sectionType} - ${section.title || ''}`,
      changes: { before: { isActive: section.isActive }, after: { isActive: updated.isActive } },
    });

    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
