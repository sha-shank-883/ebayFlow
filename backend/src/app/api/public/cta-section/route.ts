import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withRateLimit } from '@/lib/rate-limit';
import { withCache } from '@/lib/cache';

export const dynamic = 'force-dynamic';

async function handler() {
  try {
    const section = await withCache('public:cta-section', 300, async () => {
      const homePage = await prisma.page.findUnique({ where: { slug: 'home' } });
      if (!homePage) return null;
      const ctaSection = await prisma.sectionContent.findUnique({
        where: { pageId_sectionKey: { pageId: homePage.id, sectionKey: 'cta' } },
      });
      return ctaSection ? {
        badge: ctaSection.content?.badge,
        title: ctaSection.title,
        titleAccent: ctaSection.subtitle,
        description: ctaSection.content?.description,
        primaryCta: ctaSection.content?.primaryCta,
        primaryCtaLink: ctaSection.content?.primaryCtaLink,
        secondaryCta: ctaSection.content?.secondaryCta,
        secondaryCtaLink: ctaSection.content?.secondaryCtaLink,
        benefits: ctaSection.content?.benefits,
      } : null;
    });

    return NextResponse.json(section);
  } catch (error) {
    return NextResponse.json(null);
  }
}

export const GET = withRateLimit(handler, { windowMs: 60000, max: 30 });
