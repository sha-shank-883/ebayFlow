import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withRateLimit } from '@/lib/rate-limit';
import { withCache } from '@/lib/cache';

export const dynamic = 'force-dynamic';

async function handler() {
  try {
    const section = await withCache('public:trust-signals', 300, async () => {
      const homePage = await prisma.page.findUnique({ where: { slug: 'home' } });
      if (!homePage) return [];
      const tsSection = await prisma.sectionContent.findUnique({
        where: { pageId_sectionKey: { pageId: homePage.id, sectionKey: 'trust-signals' } },
      });
      return tsSection?.content?.trustSignals || [];
    });

    return NextResponse.json(section);
  } catch (error) {
    return NextResponse.json([]);
  }
}

export const GET = withRateLimit(handler, { windowMs: 60000, max: 30 });
