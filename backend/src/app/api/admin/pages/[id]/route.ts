import { NextResponse } from 'next/server';
import { requireSuperAdmin } from '../../../_auth';
import { prisma } from '../../../../../lib/prisma';
import { createAuditLog } from '../_audit';
import { atomicDeletePage, withTransaction } from '@/lib/transaction';

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const admin = await requireSuperAdmin(request);
    if (!admin) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    const page = await prisma.page.findUnique({
      where: { id: params.id },
      include: { seo: true, sections: { where: { deletedAt: null }, orderBy: { order: 'asc' } } },
    });

    if (!page) return NextResponse.json({ message: 'Page not found' }, { status: 404 });
    return NextResponse.json(page);
  } catch (error) {
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

/**
 * Updates a page with transactional safety.
 * Wraps the page update and audit log creation in a single transaction
 * to ensure atomicity - either both succeed or both roll back.
 */
export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const admin = await requireSuperAdmin(request);
    if (!admin) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    const existing = await prisma.page.findUnique({ where: { id: params.id } });
    if (!existing) return NextResponse.json({ message: 'Page not found' }, { status: 404 });

    const body = await request.json();

    const page = await withTransaction(async (tx) => {
      const updated = await tx.page.update({
        where: { id: params.id },
        data: {
          title: body.title,
          slug: body.slug,
          description: body.description,
          template: body.template,
          sortOrder: body.sortOrder,
        },
      });

      await tx.contentAudit.create({
        data: {
          action: 'UPDATE',
          entityType: 'Page',
          entityId: updated.id,
          entityName: updated.title,
          changes: { before: existing, after: updated },
        },
      });

      return updated;
    });

    return NextResponse.json(page);
  } catch (error: any) {
    if (error.code === 'P2002') {
      return NextResponse.json({ message: 'Page slug already exists' }, { status: 409 });
    }
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

/**
 * Deletes a page atomically using transaction wrapper.
 * Uses atomicDeletePage to ensure the page, its sections, and audit log
 * are all handled in a single transaction.
 */
export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const admin = await requireSuperAdmin(request);
    if (!admin) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    await atomicDeletePage(params.id);

    return NextResponse.json({ message: 'Page deleted' });
  } catch (error) {
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
