import { NextResponse } from 'next/server';
import { requireSuperAdmin } from '../../../_auth';
import { prisma } from '@/lib/prisma';
import { createAuditLog } from '../../_audit';
import { invalidateCache } from '@/lib/cache';

export const dynamic = 'force-dynamic';

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const admin = await requireSuperAdmin(request);
    if (!admin) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    const plan = await prisma.pricingPlan.findUnique({
      where: { id: params.id },
    });

    if (!plan || plan.deletedAt) {
      return NextResponse.json({ message: 'Pricing plan not found' }, { status: 404 });
    }

    return NextResponse.json(plan);
  } catch (error) {
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const admin = await requireSuperAdmin(request);
    if (!admin) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const existing = await prisma.pricingPlan.findUnique({ where: { id: params.id } });
    if (!existing) return NextResponse.json({ message: 'Pricing plan not found' }, { status: 404 });

    const updated = await prisma.pricingPlan.update({
      where: { id: params.id },
      data: {
        ...(body.name !== undefined ? { name: body.name } : {}),
        ...(body.price !== undefined ? { price: body.price } : {}),
        ...(body.period !== undefined ? { period: body.period } : {}),
        ...(body.description !== undefined ? { description: body.description } : {}),
        ...(body.features !== undefined ? { features: Array.isArray(body.features) ? body.features : [] } : {}),
        ...(body.isPopular !== undefined ? { isPopular: !!body.isPopular } : {}),
        ...(body.ctaText !== undefined ? { ctaText: body.ctaText } : {}),
        ...(body.ctaLink !== undefined ? { ctaLink: body.ctaLink } : {}),
        ...(body.order !== undefined ? { order: body.order } : {}),
        ...(body.isActive !== undefined ? { isActive: body.isActive } : {}),
      },
    });

    await createAuditLog({
      userId: admin.id,
      userEmail: admin.email,
      action: 'UPDATE',
      entityType: 'PricingPlan',
      entityId: updated.id,
      entityName: updated.name,
      changes: { before: existing, after: updated },
    });

    try {
      await invalidateCache('public:pricing:monthly');
      await invalidateCache('public:pricing:yearly');
    } catch {}

    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const admin = await requireSuperAdmin(request);
    if (!admin) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    const existing = await prisma.pricingPlan.findUnique({ where: { id: params.id } });
    if (!existing) return NextResponse.json({ message: 'Pricing plan not found' }, { status: 404 });

    await prisma.pricingPlan.update({
      where: { id: params.id },
      data: { deletedAt: new Date() },
    });

    await createAuditLog({
      userId: admin.id,
      userEmail: admin.email,
      action: 'DELETE',
      entityType: 'PricingPlan',
      entityId: existing.id,
      entityName: existing.name,
    });

    try {
      await invalidateCache('public:pricing:monthly');
      await invalidateCache('public:pricing:yearly');
    } catch {}

    return NextResponse.json({ message: 'Pricing plan deleted' });
  } catch (error) {
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
