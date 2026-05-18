import { NextResponse } from 'next/server';
import { requireSuperAdmin } from '../../_auth';
import { prisma } from '../../../../lib/prisma';
import { createAuditLog } from '../_audit';

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

    const [testimonials, total] = await Promise.all([
      prisma.testimonial.findMany({
        where,
        orderBy: { order: 'asc' },
        skip,
        take: limit,
      }),
      prisma.testimonial.count({ where }),
    ]);

    return NextResponse.json({
      data: testimonials,
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
    const maxOrder = await prisma.testimonial.aggregate({ _max: { order: true } });

    const testimonial = await prisma.testimonial.create({
      data: {
        quote: body.quote,
        author: body.author,
        role: body.role || null,
        company: body.company || null,
        avatarUrl: body.avatarUrl || null,
        rating: body.rating || 5,
        stats: body.stats || null,
        order: body.order ?? (maxOrder._max.order || 0) + 1,
      },
    });

    await createAuditLog({
      userId: admin.id,
      userEmail: admin.email,
      action: 'CREATE',
      entityType: 'Testimonial',
      entityId: testimonial.id,
      entityName: testimonial.author,
      changes: { after: testimonial },
    });

    try { await invalidateCache('public:testimonials'); } catch {}

    return NextResponse.json(testimonial, { status: 201 });
  } catch (error) {
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
