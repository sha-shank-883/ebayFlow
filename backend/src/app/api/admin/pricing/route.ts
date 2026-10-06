import { NextResponse } from 'next/server';
import { requireSuperAdmin } from '../../_auth';
import { prisma } from '@/lib/prisma';
import { createAuditLog } from '../_audit';
import { invalidateCache } from '@/lib/cache';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const admin = await requireSuperAdmin(request);
    if (!admin) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period');
    const includeInactive = searchParams.get('includeInactive') === 'true';

    const where: any = {
      deletedAt: null,
      ...(period ? { period } : {}),
      ...(!includeInactive ? { isActive: true } : {}),
    };

    const plans = await prisma.pricingPlan.findMany({
      where,
      orderBy: { order: 'asc' },
    });

    return NextResponse.json(plans);
  } catch (error) {
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const admin = await requireSuperAdmin(request);
    if (!admin) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const maxOrder = await prisma.pricingPlan.aggregate({ _max: { order: true } });

    const plan = await prisma.pricingPlan.create({
      data: {
        name: body.name,
        price: body.price,
        period: body.period || 'monthly',
        description: body.description || null,
        features: Array.isArray(body.features) ? body.features : [],
        isPopular: !!body.isPopular,
        ctaText: body.ctaText || 'Get Started',
        ctaLink: body.ctaLink || '/register',
        order: body.order ?? (maxOrder._max.order || 0) + 1,
        isActive: body.isActive ?? true,
      },
    });

    await createAuditLog({
      userId: admin.id,
      userEmail: admin.email,
      action: 'CREATE',
      entityType: 'PricingPlan',
      entityId: plan.id,
      entityName: plan.name,
      changes: { after: plan },
    });

    try {
      await invalidateCache('public:pricing:monthly');
      await invalidateCache('public:pricing:yearly');
    } catch {}

    return NextResponse.json(plan, { status: 201 });
  } catch (error) {
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
