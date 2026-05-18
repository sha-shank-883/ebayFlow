import { NextResponse } from 'next/server';
import { requireSuperAdmin } from '../../_auth';
import { prisma } from '../../../../lib/prisma';
import { createAuditLog } from '../_audit';
import { invalidateCache } from '@/lib/cache';

export async function GET(request: Request) {
  try {
    const admin = await requireSuperAdmin(request);
    if (!admin) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period');
    const includeInactive = searchParams.get('includeInactive') === 'true';

    const plans = await prisma.pricingPlan.findMany({
      where: {
        ...(period && { period }),
        ...(includeInactive ? { deletedAt: null } : { isActive: true, deletedAt: null }),
      },
      orderBy: [{ period: 'asc' }, { order: 'asc' }],
    });

    return NextResponse.json(plans);
  } catch (error) {
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const admin = await requireSuperAdmin(request);
    if (!admin) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const plan = await prisma.pricingPlan.update({
      where: { id: params.id },
      data: {
        name: body.name,
        price: body.price,
        period: body.period,
        description: body.description,
        features: body.features,
        isPopular: body.isPopular,
        ctaText: body.ctaText,
        ctaLink: body.ctaLink,
        order: body.order,
        isActive: body.isActive,
      },
    });

    await createAuditLog({
      userId: admin.id,
      userEmail: admin.email,
      action: 'UPDATE',
      entityType: 'PricingPlan',
      entityId: plan.id,
      entityName: plan.name,
      changes: { before: {}, after: plan },
    });

    try { await invalidateCache('public:pricing:*'); } catch {}

    return NextResponse.json(plan);
  } catch (error) {
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
