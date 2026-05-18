import { NextResponse } from 'next/server';
import { requireSuperAdmin } from '../../../_auth';
import { prisma } from '../../../../../lib/prisma';

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const admin = await requireSuperAdmin(request);
    if (!admin) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const category = await prisma.fAQCategory.update({
      where: { id: params.id },
      data: { name: body.name, order: body.order, isActive: body.isActive },
    });

    return NextResponse.json(category);
  } catch (error) {
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const admin = await requireSuperAdmin(request);
    if (!admin) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    await prisma.fAQCategory.update({
      where: { id: params.id },
      data: { deletedAt: new Date() },
    });

    return NextResponse.json({ message: 'Category deleted' });
  } catch (error) {
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
