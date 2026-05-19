import { NextResponse } from 'next/server';
import { requireSuperAdmin } from '../../_auth';
import { prisma } from '../../../../lib/prisma';
import { createAuditLog } from '../_audit';
import { sanitizeObject, validateSlug } from '@/lib/sanitize';
import { invalidateCache } from '@/lib/cache';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const admin = await requireSuperAdmin(request);
    if (!admin) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const includeInactive = searchParams.get('includeInactive') === 'true';
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20')));
    const skip = (page - 1) * limit;

    const where = includeInactive ? { deletedAt: null } : { isActive: true, deletedAt: null };

    const [pages, total] = await Promise.all([
      prisma.page.findMany({
        where,
        include: { seo: true, _count: { select: { sections: true } } },
        orderBy: { sortOrder: 'asc' },
        skip,
        take: limit,
      }),
      prisma.page.count({ where }),
    ]);

    return NextResponse.json({
      data: pages,
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

    const sanitizedBody = sanitizeObject(await request.json()) as Record<string, unknown>;
    const body = sanitizedBody as { slug?: string; title?: string; description?: string; template?: string; sortOrder?: number };
    if (body.slug && !validateSlug(body.slug)) return NextResponse.json({ error: 'Invalid slug' }, { status: 400 });
    const page = await prisma.page.create({
      data: {
        slug: body.slug,
        title: body.title,
        description: body.description || '',
        template: body.template || 'default',
        sortOrder: body.sortOrder || 0,
      },
    });

    await createAuditLog({
      userId: admin.id,
      userEmail: admin.email,
      action: 'CREATE',
      entityType: 'Page',
      entityId: page.id,
      entityName: page.title,
      changes: { after: page },
    });

    try { await invalidateCache('public:sections:*'); await invalidateCache('public:seo:*'); } catch {}

    return NextResponse.json(page, { status: 201 });
  } catch (error: any) {
    if (error.code === 'P2002') {
      return NextResponse.json({ message: 'Page slug already exists' }, { status: 409 });
    }
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
