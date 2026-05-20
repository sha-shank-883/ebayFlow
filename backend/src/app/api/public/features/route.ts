import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withRateLimit } from '@/lib/rate-limit';
import { withCache } from '@/lib/cache';

export const dynamic = 'force-dynamic';

async function handler() {
  try {
    const section = await withCache('public:features', 300, async () => {
      const homePage = await prisma.page.findUnique({ where: { slug: 'home' } });
      if (!homePage) return null;
      const featuresSection = await prisma.sectionContent.findUnique({
        where: { pageId_sectionKey: { pageId: homePage.id, sectionKey: 'features' } },
      });
      return featuresSection ? {
        badge: featuresSection.content?.badge,
        title: featuresSection.title,
        titleAccent: featuresSection.subtitle,
        description: featuresSection.content?.description,
        bento: featuresSection.content?.bento,
        items: featuresSection.content?.items,
      } : null;
    });

    return NextResponse.json(section);
  } catch (error) {
    return NextResponse.json(null);
  }
}

export const GET = withRateLimit(handler, { windowMs: 60000, max: 30 });
