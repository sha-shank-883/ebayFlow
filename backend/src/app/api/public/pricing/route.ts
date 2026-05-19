import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withRateLimit } from '@/lib/rate-limit';
import { withCache } from '@/lib/cache';

async function handler(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || 'monthly';

    const plans = await withCache(`public:pricing:${period}`, 300, async () => {
      return await prisma.pricingPlan.findMany({
        where: { period, isActive: true, deletedAt: null },
        orderBy: { order: 'asc' },
      });
    });

    return NextResponse.json(plans);
  } catch (error) {
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

export const GET = withRateLimit(handler, { windowMs: 60000, max: 30 });
