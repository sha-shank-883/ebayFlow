import { NextResponse } from 'next/server';
import { requireSuperAdmin } from '@/app/api/_auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const admin = await requireSuperAdmin(request);
    if (!admin) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    const t = await prisma.testimonial.findUnique({ where: { id: params.id } });
    if (!t) return NextResponse.json({ message: 'Not found' }, { status: 404 });

    const updated = await prisma.testimonial.update({
      where: { id: params.id },
      data: { isActive: !t.isActive },
    });

    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
