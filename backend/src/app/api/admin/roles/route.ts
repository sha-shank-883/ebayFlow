import { NextResponse } from 'next/server';
import { requireSuperAdmin } from '@/app/api/_auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const admin = await requireSuperAdmin(request);
    if (!admin) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    const roles = await prisma.adminRole.findMany({
      where: { isActive: true },
      include: { _count: { select: { users: true } } },
    });

    return NextResponse.json(roles);
  } catch (error) {
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const admin = await requireSuperAdmin(request);
    if (!admin) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const role = await prisma.adminRole.create({
      data: { name: body.name, description: body.description, permissions: body.permissions || [] },
    });

    return NextResponse.json(role, { status: 201 });
  } catch (error: any) {
    if (error.code === 'P2002') {
      return NextResponse.json({ message: 'Role name already exists' }, { status: 409 });
    }
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
