import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withRateLimit } from '@/lib/rate-limit';
import { withCache } from '@/lib/cache';

export const dynamic = 'force-dynamic';

async function handler() {
  try {
    const data = await withCache('public:about-page', 300, async () => {
      const aboutPage = await prisma.page.findUnique({ where: { slug: 'about' } });
      if (!aboutPage) return null;

      const contentSection = await prisma.sectionContent.findUnique({
        where: { pageId_sectionKey: { pageId: aboutPage.id, sectionKey: 'about-content' } },
      });
      const valuesSection = await prisma.sectionContent.findUnique({
        where: { pageId_sectionKey: { pageId: aboutPage.id, sectionKey: 'values' } },
      });
      const milestonesSection = await prisma.sectionContent.findUnique({
        where: { pageId_sectionKey: { pageId: aboutPage.id, sectionKey: 'milestones' } },
      });

      return {
        mission: contentSection?.content?.mission,
        vision: contentSection?.content?.vision,
        values: valuesSection?.content?.values,
        milestones: milestonesSection?.content?.milestones,
      };
    });

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(null);
  }
}

export const GET = withRateLimit(handler, { windowMs: 60000, max: 30 });
