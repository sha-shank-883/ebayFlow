import { NextResponse } from 'next/server';
import { requireSuperAdmin } from '@/app/api/_auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const admin = await requireSuperAdmin(request);
    if (!admin) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20')));
    const skip = (page - 1) * limit;

    const where = { deletedAt: null };

    const [redirects, total] = await Promise.all([
      prisma.redirect.findMany({
        where,
        orderBy: { from: 'asc' },
        skip,
        take: limit,
      }),
      prisma.redirect.count({ where }),
    ]);

    return NextResponse.json({
      data: redirects,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const admin = await requireSuperAdmin(request);
    if (!admin) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const redirect = await prisma.redirect.create({ data: body });
    return NextResponse.json(redirect, { status: 201 });
  } catch (error: any) {
    if (error.code === 'P2002') {
      return NextResponse.json({ message: 'Redirect path already exists' }, { status: 409 });
    }
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
