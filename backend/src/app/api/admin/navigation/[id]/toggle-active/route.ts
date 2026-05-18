import { NextResponse } from 'next/server';
import { requireSuperAdmin } from '../../../../_auth';
import { prisma } from '../../../../../../lib/prisma';

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const admin = await requireSuperAdmin(request);
    if (!admin) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    const item = await prisma.navigationItem.findUnique({ where: { id: params.id } });
    if (!item) return NextResponse.json({ message: 'Not found' }, { status: 404 });

    const updated = await prisma.navigationItem.update({
      where: { id: params.id },
      data: { isActive: !item.isActive },
    });

    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
