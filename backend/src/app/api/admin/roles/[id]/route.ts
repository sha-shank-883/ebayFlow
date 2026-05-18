import { NextResponse } from 'next/server';
import { requireSuperAdmin } from '../../../_auth';
import { prisma } from '../../../../../lib/prisma';

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const admin = await requireSuperAdmin(request);
    if (!admin) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const role = await prisma.adminRole.update({
      where: { id: params.id },
      data: { name: body.name, description: body.description, permissions: body.permissions, isActive: body.isActive },
    });

    return NextResponse.json(role);
  } catch (error) {
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const admin = await requireSuperAdmin(request);
    if (!admin) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    const role = await prisma.adminRole.findUnique({ where: { id: params.id } });
    if (role?.isSystem) {
      return NextResponse.json({ message: 'Cannot delete system roles' }, { status: 400 });
    }

    await prisma.adminRole.delete({ where: { id: params.id } });
    return NextResponse.json({ message: 'Role deleted' });
  } catch (error) {
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
