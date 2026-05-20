import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withRateLimit } from '@/lib/rate-limit';
import { withCache } from '@/lib/cache';

export const dynamic = 'force-dynamic';

async function handler() {
  try {
    const section = await withCache('public:logos', 300, async () => {
      const homePage = await prisma.page.findUnique({ where: { slug: 'home' } });
      if (!homePage) return [];
      const logosSection = await prisma.sectionContent.findUnique({
        where: { pageId_sectionKey: { pageId: homePage.id, sectionKey: 'logos' } },
      });
      return logosSection?.content?.logos || [];
    });

    return NextResponse.json(section);
  } catch (error) {
    return NextResponse.json([]);
  }
}

export const GET = withRateLimit(handler, { windowMs: 60000, max: 30 });
