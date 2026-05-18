import { NextResponse } from 'next/server';
import { prisma } from '../../../../../lib/prisma';
import { withRateLimit } from '@/lib/rate-limit';
import { withCache } from '@/lib/cache';

async function handler(request: Request, { params }: { params: { location: string } }) {
  try {
    const items = await withCache(`public:nav:${params.location}`, 300, async () => {
      return await prisma.navigationItem.findMany({
        where: { location: params.location, isActive: true, deletedAt: null },
        orderBy: [{ column: 'asc' }, { order: 'asc' }],
      });
    });

    return NextResponse.json(items);
  } catch (error) {
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

export const GET = withRateLimit(handler, { windowMs: 60000, max: 30 });
