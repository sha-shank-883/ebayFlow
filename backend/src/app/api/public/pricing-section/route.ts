import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withRateLimit } from '@/lib/rate-limit';
import { withCache } from '@/lib/cache';

export const dynamic = 'force-dynamic';

async function handler() {
  try {
    const section = await withCache('public:pricing-section', 300, async () => {
      const pricingPage = await prisma.page.findUnique({ where: { slug: 'pricing' } });
      if (!pricingPage) return null;

      const guaranteesSection = await prisma.sectionContent.findUnique({
        where: { pageId_sectionKey: { pageId: pricingPage.id, sectionKey: 'guarantees' } },
      });
      const trustSection = await prisma.sectionContent.findUnique({
        where: { pageId_sectionKey: { pageId: pricingPage.id, sectionKey: 'trust-signals' } },
      });
      const faqsSection = await prisma.sectionContent.findUnique({
        where: { pageId_sectionKey: { pageId: pricingPage.id, sectionKey: 'faqs' } },
      });

      return {
        section: {
          title: 'Invest in Your',
          titleAccent: 'eBay Empire',
          badge: trustSection?.content?.badge || 'Save 20%',
          description: 'Transparent pricing tailored for eBay sellers of all sizes worldwide.',
          trustSignals: trustSection?.content?.trustSignals || [],
          ctaText: trustSection?.content?.ctaText || 'Have questions?',
          ctaLinkText: trustSection?.content?.ctaLinkText || 'Chat with our team',
        },
        guarantees: guaranteesSection?.content?.guarantees || [],
        faqs: faqsSection?.content?.faqs || [],
      };
    });

    return NextResponse.json(section);
  } catch (error) {
    return NextResponse.json(null);
  }
}

export const GET = withRateLimit(handler, { windowMs: 60000, max: 30 });
