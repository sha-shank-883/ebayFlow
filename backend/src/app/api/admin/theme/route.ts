import { NextResponse } from 'next/server';
import { requireSuperAdmin } from '@/app/api/_auth';
import { prisma } from '@/lib/prisma';
import { createAuditLog } from '@/app/api/admin/_audit';
import { sanitizeObject } from '@/lib/sanitize';
import { invalidateCache } from '@/lib/cache';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const admin = await requireSuperAdmin(request);
    if (!admin) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    const themes = await prisma.themeDesign.findMany({
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
    });
    return NextResponse.json(themes);
  } catch (error) {
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const admin = await requireSuperAdmin(request);
    if (!admin) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const { id, ...data } = sanitizeObject(body) as Record<string, unknown>;

    const existing = await prisma.themeDesign.findFirst({ where: { id: id as string } });
    if (!existing) {
      return NextResponse.json({ message: 'Theme not found' }, { status: 404 });
    }

    const theme = await prisma.themeDesign.update({
      where: { id: id as string },
      data: data as any,
    });

    await createAuditLog({
      userId: admin.id,
      userEmail: admin.email,
      action: 'UPDATE',
      entityType: 'ThemeDesign',
      entityId: theme.id,
      entityName: theme.name,
      changes: { before: existing, after: theme },
    });

    try { await invalidateCache('public:theme'); } catch {}

    return NextResponse.json(theme);
  } catch (error) {
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
