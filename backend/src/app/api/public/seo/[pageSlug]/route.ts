import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withRateLimit } from '@/lib/rate-limit';
import { withCache } from '@/lib/cache';

async function handler(request: Request, { params }: { params: { pageSlug: string } }) {
  try {
    const result = await withCache(`public:seo:${params.pageSlug}`, 300, async () => {
      const page = await prisma.page.findFirst({
        where: { slug: params.pageSlug, isActive: true, deletedAt: null },
        include: { seo: true },
      });

      if (!page) return { error: 'Page not found', status: 404 };
      return { seo: page.seo || {} };
    });

    if ('error' in result) {
      return NextResponse.json({ message: result.error }, { status: result.status });
    }

    return NextResponse.json(result.seo);
  } catch (error) {
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

export const GET = withRateLimit(handler, { windowMs: 60000, max: 30 });
