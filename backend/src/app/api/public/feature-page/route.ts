import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withRateLimit } from '@/lib/rate-limit';
import { withCache } from '@/lib/cache';

export const dynamic = 'force-dynamic';

async function handler() {
  try {
    const data = await withCache('public:feature-page', 300, async () => {
      const featuresPage = await prisma.page.findUnique({ where: { slug: 'features' } });
      if (!featuresPage) return null;

      const sectionsSection = await prisma.sectionContent.findUnique({
        where: { pageId_sectionKey: { pageId: featuresPage.id, sectionKey: 'feature-sections' } },
      });
      const comparisonSection = await prisma.sectionContent.findUnique({
        where: { pageId_sectionKey: { pageId: featuresPage.id, sectionKey: 'comparison' } },
      });

      return {
        sections: sectionsSection?.content?.sections,
        comparison: comparisonSection?.content,
      };
    });

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(null);
  }
}

export const GET = withRateLimit(handler, { windowMs: 60000, max: 30 });
