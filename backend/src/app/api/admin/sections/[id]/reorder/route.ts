import { NextResponse } from 'next/server';
import { requireSuperAdmin } from '@/app/api/_auth';
import { prisma } from '@/lib/prisma';

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const admin = await requireSuperAdmin(request);
    if (!admin) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const { newOrder } = body;

    if (typeof newOrder !== 'number') {
      return NextResponse.json({ message: 'newOrder is required' }, { status: 400 });
    }

    const section = await prisma.sectionContent.findUnique({ where: { id: params.id } });
    if (!section) return NextResponse.json({ message: 'Section not found' }, { status: 404 });

    const oldOrder = section.order;

    if (newOrder > oldOrder) {
      await prisma.sectionContent.updateMany({
        where: { pageId: section.pageId, order: { gt: oldOrder, lte: newOrder } },
        data: { order: { decrement: 1 } },
      });
    } else {
      await prisma.sectionContent.updateMany({
        where: { pageId: section.pageId, order: { gte: newOrder, lt: oldOrder } },
        data: { order: { increment: 1 } },
      });
    }

    const updated = await prisma.sectionContent.update({
      where: { id: params.id },
      data: { order: newOrder },
    });

    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
