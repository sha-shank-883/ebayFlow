import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withCache } from '@/lib/cache';

export const dynamic = 'force-dynamic';

export async function GET(request: Request, context: { params: { pageSlug: string } }) {
  try {
    const { pageSlug } = context.params;

    const data = await withCache(`public:metadata:${pageSlug}`, 300, async () => {
      const page = await prisma.page.findUnique({
        where: { slug: pageSlug },
        include: { seo: true },
      });

      if (!page) return null;

      return {
        slug: page.slug,
        title: page.title,
        description: page.description,
        template: page.template,
        seo: page.seo ? {
          metaTitle: page.seo.metaTitle,
          metaDescription: page.seo.metaDescription,
          metaKeywords: page.seo.metaKeywords,
          ogTitle: page.seo.ogTitle,
          ogDescription: page.seo.ogDescription,
          ogImageUrl: page.seo.ogImageUrl,
          canonicalUrl: page.seo.canonicalUrl,
          robotsIndex: page.seo.robotsIndex,
          customJsonLd: page.seo.customJsonLd,
        } : null,
      };
    });

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(null);
  }
}
