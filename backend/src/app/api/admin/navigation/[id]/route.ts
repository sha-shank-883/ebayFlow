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

    const { searchParams } = new URL(request.url);
    const location = searchParams.get('location');
    const includeInactive = searchParams.get('includeInactive') === 'true';

    const items = await prisma.navigationItem.findMany({
      where: {
        ...(location && { location }),
        ...(includeInactive ? { deletedAt: null } : { isActive: true, deletedAt: null }),
      },
      orderBy: [{ location: 'asc' }, { column: 'asc' }, { order: 'asc' }],
    });

    return NextResponse.json(items);
  } catch (error) {
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const admin = await requireSuperAdmin(request);
    if (!admin) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    const sanitizedBody = sanitizeObject(await request.json()) as Record<string, unknown>;
    const item = await prisma.navigationItem.create({ data: sanitizedBody as any });

    await createAuditLog({
      userId: admin.id,
      userEmail: admin.email,
      action: 'CREATE',
      entityType: 'NavigationItem',
      entityId: item.id,
      entityName: item.label,
      changes: { after: item },
    });

    try { await invalidateCache('public:nav:*'); } catch {}

    return NextResponse.json(item, { status: 201 });
  } catch (error) {
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
