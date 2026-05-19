import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withRateLimit } from '@/lib/rate-limit';
import { withCache } from '@/lib/cache';

async function handler() {
  try {
    const categories = await withCache('public:faqs', 300, async () => {
      return await prisma.fAQCategory.findMany({
        where: { isActive: true, deletedAt: null },
        include: {
          items: {
            where: { isActive: true, deletedAt: null },
            orderBy: { order: 'asc' },
          },
        },
        orderBy: { order: 'asc' },
      });
    });

    return NextResponse.json(categories);
  } catch (error) {
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

export const GET = withRateLimit(handler, { windowMs: 60000, max: 30 });
