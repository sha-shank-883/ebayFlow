import { NextResponse } from 'next/server';
import { requireSuperAdmin } from '../../../../_auth';
import { prisma } from '../../../../../../lib/prisma';
import { createAuditLog } from '../../../_audit';
import { invalidateCache } from '@/lib/cache';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const admin = await requireSuperAdmin(request);
    if (!admin) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const includeInactive = searchParams.get('includeInactive') === 'true';

    const categories = await prisma.fAQCategory.findMany({
      where: includeInactive ? { deletedAt: null } : { isActive: true, deletedAt: null },
      include: {
        items: {
          where: includeInactive ? { deletedAt: null } : { isActive: true, deletedAt: null },
          orderBy: { order: 'asc' },
        },
      },
      orderBy: { order: 'asc' },
    });

    return NextResponse.json(categories);
  } catch (error) {
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const admin = await requireSuperAdmin(request);
    if (!admin) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const { action, data } = body;

    if (action === 'category') {
      const maxOrder = await prisma.fAQCategory.aggregate({ _max: { order: true } });
      const category = await prisma.fAQCategory.create({
        data: { name: data.name, order: data.order ?? (maxOrder._max.order || 0) + 1 },
      });
      await createAuditLog({ userId: admin.id, userEmail: admin.email, action: 'CREATE', entityType: 'FAQCategory', entityId: category.id, entityName: category.name, changes: { after: category } });
      try { await invalidateCache('public:faqs'); } catch {}
      return NextResponse.json(category, { status: 201 });
    }

    if (action === 'item') {
      const maxOrder = await prisma.fAQItem.aggregate({ where: { categoryId: data.categoryId }, _max: { order: true } });
      const item = await prisma.fAQItem.create({
        data: { categoryId: data.categoryId, question: data.question, answer: data.answer, order: data.order ?? (maxOrder._max.order || 0) + 1 },
      });
      await createAuditLog({ userId: admin.id, userEmail: admin.email, action: 'CREATE', entityType: 'FAQItem', entityId: item.id, entityName: data.question, changes: { after: item } });
      try { await invalidateCache('public:faqs'); } catch {}
      return NextResponse.json(item, { status: 201 });
    }

    return NextResponse.json({ message: 'Invalid action' }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
