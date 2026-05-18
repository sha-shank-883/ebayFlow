import { NextResponse } from 'next/server';
import { requireSuperAdmin } from '../../_auth';
import { prisma } from '../../../../lib/prisma';
import { createAuditLog } from '../_audit';
import { sanitizeObject } from '@/lib/sanitize';
import { invalidateCache } from '@/lib/cache';

export async function GET(request: Request) {
  try {
    const admin = await requireSuperAdmin(request);
    if (!admin) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    const settings = await prisma.siteSettings.findFirst();
    return NextResponse.json(settings || {});
  } catch (error) {
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const admin = await requireSuperAdmin(request);
    if (!admin) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    const sanitizedBody = sanitizeObject(await request.json()) as Record<string, unknown>;
    const existing = await prisma.siteSettings.findFirst();

    const settings = await prisma.siteSettings.upsert({
      where: { id: existing?.id || 'default' },
      update: sanitizedBody,
      create: { id: 'default', ...sanitizedBody },
    });

    await createAuditLog({
      userId: admin.id,
      userEmail: admin.email,
      action: 'UPDATE',
      entityType: 'SiteSettings',
      entityId: settings.id,
      changes: { before: existing, after: settings },
    });

    try { await invalidateCache('public:settings'); } catch {}

    return NextResponse.json(settings);
  } catch (error) {
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
