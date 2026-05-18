import { NextResponse } from 'next/server';
import { requireSuperAdmin } from '../../_auth';
import { prisma } from '../../../../lib/prisma';

export async function GET(request: Request) {
  try {
    const admin = await requireSuperAdmin(request);
    if (!admin) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    const [
      pagesCount,
      sectionsCount,
      blogPostsCount,
      testimonialsCount,
      faqCategoriesCount,
      faqItemsCount,
      pricingPlansCount,
      mediaCount,
      navItemsCount,
      redirectsCount,
      recentAudits,
    ] = await Promise.all([
      prisma.page.count({ where: { isActive: true, deletedAt: null } }),
      prisma.sectionContent.count({ where: { isActive: true, deletedAt: null } }),
      prisma.blogPost.count({ where: { status: 'PUBLISHED', isActive: true, deletedAt: null } }),
      prisma.testimonial.count({ where: { isActive: true, deletedAt: null } }),
      prisma.fAQCategory.count({ where: { isActive: true, deletedAt: null } }),
      prisma.fAQItem.count({ where: { isActive: true, deletedAt: null } }),
      prisma.pricingPlan.count({ where: { isActive: true, deletedAt: null } }),
      prisma.mediaAsset.count({ where: { isActive: true, deletedAt: null } }),
      prisma.navigationItem.count({ where: { isActive: true, deletedAt: null } }),
      prisma.redirect.count({ where: { isActive: true, deletedAt: null } }),
      prisma.contentAudit.findMany({ take: 10, orderBy: { createdAt: 'desc' } }),
    ]);

    return NextResponse.json({
      pagesCount,
      sectionsCount,
      blogPostsCount,
      testimonialsCount,
      faqCategoriesCount,
      faqItemsCount,
      pricingPlansCount,
      mediaCount,
      navItemsCount,
      redirectsCount,
      recentAudits,
    });
  } catch (error) {
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
