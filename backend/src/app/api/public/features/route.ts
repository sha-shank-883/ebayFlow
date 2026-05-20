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
      if (!featuresSection) return null;
      
      return {
        badge: featuresSection.content?.badge || null,
        title: featuresSection.title || null,
        titleAccent: featuresSection.subtitle || null,
        description: featuresSection.content?.description || null,
        bento: featuresSection.content?.bento || null,
        items: featuresSection.content?.items || [],
        services: featuresSection.content?.items || [],
      };
    });

    if (!section) return NextResponse.json(null);
    return NextResponse.json(section);
  } catch (error) {
    return NextResponse.json(null);
  }
}

export const GET = withRateLimit(handler, { windowMs: 60000, max: 30 });
