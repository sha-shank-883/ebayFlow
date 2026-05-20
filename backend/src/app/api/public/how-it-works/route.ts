import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withRateLimit } from '@/lib/rate-limit';
import { withCache } from '@/lib/cache';

export const dynamic = 'force-dynamic';

async function handler() {
  try {
    const section = await withCache('public:how-it-works', 300, async () => {
      const homePage = await prisma.page.findUnique({ where: { slug: 'home' } });
      if (!homePage) return null;
      const hiwSection = await prisma.sectionContent.findUnique({
        where: { pageId_sectionKey: { pageId: homePage.id, sectionKey: 'how-it-works' } },
      });
      return hiwSection ? {
        badge: hiwSection.content?.badge,
        title: hiwSection.title,
        titleAccent: hiwSection.subtitle,
        description: hiwSection.content?.description,
        steps: hiwSection.content?.steps,
      } : null;
    });

    return NextResponse.json(section);
  } catch (error) {
    return NextResponse.json(null);
  }
}

export const GET = withRateLimit(handler, { windowMs: 60000, max: 30 });
