import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withRateLimit } from '@/lib/rate-limit';
import { withCache } from '@/lib/cache';

export const dynamic = 'force-dynamic';

async function handler() {
  try {
    const data = await withCache('public:contact-page', 300, async () => {
      const contactPage = await prisma.page.findUnique({ where: { slug: 'contact' } });
      if (!contactPage) return null;

      const contentSection = await prisma.sectionContent.findUnique({
        where: { pageId_sectionKey: { pageId: contactPage.id, sectionKey: 'contact-content' } },
      });
      const formSection = await prisma.sectionContent.findUnique({
        where: { pageId_sectionKey: { pageId: contactPage.id, sectionKey: 'form-schema' } },
      });
      const infoSection = await prisma.sectionContent.findUnique({
        where: { pageId_sectionKey: { pageId: contactPage.id, sectionKey: 'contact-info' } },
      });

      return {
        badge: contentSection?.content?.badge,
        title: contentSection?.content?.title,
        titleAccent: contentSection?.content?.titleAccent,
        description: contentSection?.content?.description,
        form: formSection?.content,
        info: infoSection?.content,
      };
    });

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(null);
  }
}

export const GET = withRateLimit(handler, { windowMs: 60000, max: 30 });
