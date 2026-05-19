import { NextResponse } from 'next/server';
import { requireSuperAdmin } from '@/app/api/_auth';
import { prisma } from '@/lib/prisma';
import * as bcrypt from 'bcryptjs';
import { sanitizeObject, validateEmail } from '@/lib/sanitize';

export async function GET(request: Request) {
  try {
    const admin = await requireSuperAdmin(request);
    if (!admin) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    const users = await prisma.user.findMany({
      select: { id: true, email: true, name: true, role: true, isActive: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(users);
  } catch (error) {
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const admin = await requireSuperAdmin(request);
    if (!admin) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    const sanitizedBody = sanitizeObject(await request.json()) as Record<string, unknown>;
    const body = sanitizedBody as { email?: string; name?: string; password?: string; role?: string };
    if (body.email && !validateEmail(body.email)) return NextResponse.json({ error: 'Invalid email' }, { status: 400 });
    const hashedPassword = await bcrypt.hash(body.password, 10);

    const user = await prisma.user.create({
      data: {
        email: body.email,
        name: body.name,
        password: hashedPassword,
        role: body.role || 'EDITOR',
        isVerified: true,
      },
    });

    // Link to admin role if not USER
    if (body.role && body.role !== 'USER') {
      const role = await prisma.adminRole.findFirst({ where: { name: body.role } });
      if (role) {
        await prisma.adminUser.create({
          data: { userId: user.id, roleId: role.id },
        });
      }
    }

    return NextResponse.json({ id: user.id, email: user.email, name: user.name, role: user.role }, { status: 201 });
  } catch (error: any) {
    if (error.code === 'P2002') {
      return NextResponse.json({ message: 'Email already exists' }, { status: 409 });
    }
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
