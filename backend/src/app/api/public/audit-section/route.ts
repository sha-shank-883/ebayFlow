import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withRateLimit } from '@/lib/rate-limit';
import { withCache } from '@/lib/cache';

export const dynamic = 'force-dynamic';

async function handler() {
  try {
    const section = await withCache('public:audit-section', 300, async () => {
      const homePage = await prisma.page.findUnique({ where: { slug: 'home' } });
      if (!homePage) return null;
      const auditSection = await prisma.sectionContent.findUnique({
        where: { pageId_sectionKey: { pageId: homePage.id, sectionKey: 'audit' } },
      });
      return auditSection ? {
        badge: auditSection.content?.badge,
        title: auditSection.title,
        titleAccent: auditSection.subtitle,
        description: auditSection.content?.description,
        features: auditSection.content?.features,
        formTitle: auditSection.content?.formTitle,
        formDescription: auditSection.content?.formDescription,
      } : null;
    });

    return NextResponse.json(section);
  } catch (error) {
    return NextResponse.json(null);
  }
}

export const GET = withRateLimit(handler, { windowMs: 60000, max: 30 });
