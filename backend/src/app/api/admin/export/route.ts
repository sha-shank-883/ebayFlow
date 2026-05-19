import { NextResponse } from 'next/server';
import { requireSuperAdmin } from '../../_auth';
import { prisma } from '../../../../lib/prisma';
import { createAuditLog } from '../_audit';

const EXPORT_VERSION = '1.0.0';

/**
 * Validates the structure of an import payload
 */
function validateImportPayload(data: unknown): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!data || typeof data !== 'object') {
    return { valid: false, errors: ['Import data must be a valid JSON object'] };
  }

  const payload = data as Record<string, unknown>;
  const validEntityKeys = [
    'siteSettings',
    'pages',
    'sections',
    'navigationItems',
    'mediaAssets',
    'blogPosts',
    'testimonials',
    'faqs',
    'pricingPlans',
    'redirects',
  ];

  const providedKeys = Object.keys(payload);
  const hasAnyContent = providedKeys.some((key) => validEntityKeys.includes(key));

  if (!hasAnyContent) {
    errors.push('Import data must contain at least one valid entity key');
  }

  if (payload.siteSettings && typeof payload.siteSettings !== 'object') {
    errors.push('siteSettings must be an object');
  }

  const arrayKeys = [
    'pages',
    'sections',
    'navigationItems',
    'mediaAssets',
    'blogPosts',
    'testimonials',
    'faqs',
    'pricingPlans',
    'redirects',
  ] as const;

  for (const key of arrayKeys) {
    if (payload[key] !== undefined && !Array.isArray(payload[key])) {
      errors.push(`${key} must be an array`);
    }
  }

  if (payload.mode && !['merge', 'overwrite'].includes(payload.mode as string)) {
    errors.push('mode must be either "merge" or "overwrite"');
  }

  return { valid: errors.length === 0, errors };
}

/**
 * GET - Exports all website content as JSON
 *
 * Returns a downloadable JSON file containing all website content including:
 * SiteSettings, Pages, Sections, NavigationItems, MediaAssets, BlogPosts,
 * Testimonials, FAQs, PricingPlans, and Redirects.
 *
 * Response includes metadata: exportDate, version, totalRecords
 */
export async function GET(request: Request) {
  try {
    const admin = await requireSuperAdmin(request);
    if (!admin) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const [
      siteSettings,
      pages,
      sections,
      navigationItems,
      mediaAssets,
      blogPosts,
      testimonials,
      faqCategories,
      pricingPlans,
      redirects,
    ] = await Promise.all([
      prisma.siteSettings.findMany(),
      prisma.page.findMany({
        where: { deletedAt: null },
        include: { seo: true },
        orderBy: { sortOrder: 'asc' },
      }),
      prisma.sectionContent.findMany({
        where: { deletedAt: null },
        orderBy: [{ pageId: 'asc' }, { order: 'asc' }],
      }),
      prisma.navigationItem.findMany({
        where: { deletedAt: null },
        orderBy: [{ location: 'asc' }, { order: 'asc' }],
      }),
      prisma.mediaAsset.findMany({
        where: { deletedAt: null },
        orderBy: { uploadedAt: 'desc' },
      }),
      prisma.blogPost.findMany({
        where: { deletedAt: null },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.testimonial.findMany({
        where: { deletedAt: null },
        orderBy: { order: 'asc' },
      }),
      prisma.fAQCategory.findMany({
        where: { deletedAt: null },
        include: { items: { where: { deletedAt: null }, orderBy: { order: 'asc' } } },
        orderBy: { order: 'asc' },
      }),
      prisma.pricingPlan.findMany({
        where: { deletedAt: null },
        orderBy: { order: 'asc' },
      }),
      prisma.redirect.findMany({
        where: { deletedAt: null },
        orderBy: { from: 'asc' },
      }),
    ]);

    const totalRecords =
      siteSettings.length +
      pages.length +
      sections.length +
      navigationItems.length +
      mediaAssets.length +
      blogPosts.length +
      testimonials.length +
      faqCategories.length +
      faqCategories.reduce((sum, cat) => sum + cat.items.length, 0) +
      pricingPlans.length +
      redirects.length;

    const exportData = {
      metadata: {
        exportDate: new Date().toISOString(),
        version: EXPORT_VERSION,
        exportedBy: admin.email,
        totalRecords,
      },
      siteSettings: siteSettings[0] || null,
      pages,
      sections,
      navigationItems,
      mediaAssets,
      blogPosts,
      testimonials,
      faqs: faqCategories,
      pricingPlans,
      redirects,
    };

    const jsonString = JSON.stringify(exportData, null, 2);

    await createAuditLog({
      userId: admin.id,
      userEmail: admin.email,
      action: 'EXPORT',
      entityType: 'ContentExport',
      entityId: 'full-export',
      entityName: 'Full Content Export',
      changes: { totalRecords, version: EXPORT_VERSION },
    });

    return new NextResponse(jsonString, {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="content-export-${new Date().toISOString().split('T')[0]}.json"`,
      },
    });
  } catch (error) {
    console.error('Export error:', error);
    return NextResponse.json(
      { message: 'Failed to export content', error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * POST - Imports content from JSON
 *
 * Validates incoming JSON structure and imports content using Prisma transactions
 * for atomicity. Supports merge (default) and overwrite modes.
 *
 * Returns summary with created, updated, and skipped counts.
 */
export async function POST(request: Request) {
  try {
    const admin = await requireSuperAdmin(request);
    if (!admin) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ message: 'Invalid JSON body' }, { status: 400 });
    }

    const validation = validateImportPayload(body);
    if (!validation.valid) {
      return NextResponse.json({ message: 'Validation failed', errors: validation.errors }, { status: 400 });
    }

    const data = body as Record<string, unknown>;
    const mode = (data.mode as 'merge' | 'overwrite') || 'merge';

    const summary = {
      created: 0,
      updated: 0,
      skipped: 0,
      errors: [] as string[],
    };

    await prisma.$transaction(async (tx) => {
      // Import SiteSettings
      if (data.siteSettings) {
        try {
          const settings = data.siteSettings as Record<string, unknown>;
          const { id, createdAt, updatedAt, ...settingsData } = settings;
          const existing = await tx.siteSettings.findFirst();

          if (existing && mode === 'merge') {
            await tx.siteSettings.update({
              where: { id: existing.id },
              data: settingsData as any,
            });
            summary.updated++;
          } else if (existing && mode === 'overwrite') {
            await tx.siteSettings.update({
              where: { id: existing.id },
              data: settingsData as any,
            });
            summary.updated++;
          } else {
            await tx.siteSettings.create({
              data: { id: (id as string) || 'default', ...settingsData } as any,
            });
            summary.created++;
          }
        } catch (err) {
          summary.errors.push(`SiteSettings: ${err instanceof Error ? err.message : 'Unknown error'}`);
        }
      }

      // Import Pages
      if (Array.isArray(data.pages)) {
        for (const page of data.pages as Record<string, unknown>[]) {
          try {
            const { id, createdAt, updatedAt, seo, ...pageData } = page;
            const existing = await tx.page.findUnique({ where: { slug: pageData.slug as string } });

            if (existing) {
              if (mode === 'overwrite') {
                await tx.page.update({
                  where: { id: existing.id },
                  data: pageData as any,
                });
                summary.updated++;

                if (seo) {
                  await tx.pageSEO.upsert({
                    where: { pageId: existing.id },
                    update: seo as any,
                    create: { pageId: existing.id, ...(seo as any) },
                  });
                }
              } else {
                summary.skipped++;
              }
            } else {
              const created = await tx.page.create({
                data: pageData as any,
              });
              summary.created++;

              if (seo) {
                await tx.pageSEO.create({
                  data: { pageId: created.id, ...(seo as any) },
                });
              }
            }
          } catch (err) {
            summary.errors.push(`Page ${page.slug}: ${err instanceof Error ? err.message : 'Unknown error'}`);
          }
        }
      }

      // Import Sections
      if (Array.isArray(data.sections)) {
        for (const section of data.sections as Record<string, unknown>[]) {
          try {
            const { id, createdAt, updatedAt, ...sectionData } = section;
            const pageExists = await tx.page.findUnique({
              where: { slug: sectionData.pageId as string },
            });

            if (!pageExists) {
              summary.skipped++;
              continue;
            }

            const existing = await tx.sectionContent.findFirst({
              where: {
                pageId: pageExists.id,
                sectionKey: sectionData.sectionKey as string,
              },
            });

            if (existing) {
              if (mode === 'overwrite') {
                await tx.sectionContent.update({
                  where: { id: existing.id },
                  data: { ...sectionData, pageId: pageExists.id } as any,
                });
                summary.updated++;
              } else {
                summary.skipped++;
              }
            } else {
              await tx.sectionContent.create({
                data: { ...sectionData, pageId: pageExists.id } as any,
              });
              summary.created++;
            }
          } catch (err) {
            summary.errors.push(`Section ${section.sectionKey}: ${err instanceof Error ? err.message : 'Unknown error'}`);
          }
        }
      }

      // Import NavigationItems
      if (Array.isArray(data.navigationItems)) {
        for (const item of data.navigationItems as Record<string, unknown>[]) {
          try {
            const { id, createdAt, updatedAt, ...itemData } = item;
            const existing = await tx.navigationItem.findFirst({
              where: {
                location: itemData.location as string,
                href: itemData.href as string,
                label: itemData.label as string,
              },
            });

            if (existing) {
              if (mode === 'overwrite') {
                await tx.navigationItem.update({
                  where: { id: existing.id },
                  data: itemData as any,
                });
                summary.updated++;
              } else {
                summary.skipped++;
              }
            } else {
              await tx.navigationItem.create({
                data: itemData as any,
              });
              summary.created++;
            }
          } catch (err) {
            summary.errors.push(`NavigationItem ${item.label}: ${err instanceof Error ? err.message : 'Unknown error'}`);
          }
        }
      }

      // Import MediaAssets
      if (Array.isArray(data.mediaAssets)) {
        for (const asset of data.mediaAssets as Record<string, unknown>[]) {
          try {
            const { id, createdAt, updatedAt, uploadedAt, ...assetData } = asset;
            const existing = await tx.mediaAsset.findFirst({
              where: { url: assetData.url as string },
            });

            if (existing) {
              if (mode === 'overwrite') {
                await tx.mediaAsset.update({
                  where: { id: existing.id },
                  data: assetData as any,
                });
                summary.updated++;
              } else {
                summary.skipped++;
              }
            } else {
              await tx.mediaAsset.create({
                data: assetData as any,
              });
              summary.created++;
            }
          } catch (err) {
            summary.errors.push(`MediaAsset ${asset.filename}: ${err instanceof Error ? err.message : 'Unknown error'}`);
          }
        }
      }

      // Import BlogPosts
      if (Array.isArray(data.blogPosts)) {
        for (const post of data.blogPosts as Record<string, unknown>[]) {
          try {
            const { id, createdAt, updatedAt, ...postData } = post;
            const existing = await tx.blogPost.findUnique({
              where: { slug: postData.slug as string },
            });

            if (existing) {
              if (mode === 'overwrite') {
                await tx.blogPost.update({
                  where: { id: existing.id },
                  data: postData as any,
                });
                summary.updated++;
              } else {
                summary.skipped++;
              }
            } else {
              await tx.blogPost.create({
                data: postData as any,
              });
              summary.created++;
            }
          } catch (err) {
            summary.errors.push(`BlogPost ${post.slug}: ${err instanceof Error ? err.message : 'Unknown error'}`);
          }
        }
      }

      // Import Testimonials
      if (Array.isArray(data.testimonials)) {
        for (const testimonial of data.testimonials as Record<string, unknown>[]) {
          try {
            const { id, createdAt, updatedAt, ...testimonialData } = testimonial;
            const existing = await tx.testimonial.findFirst({
              where: {
                quote: testimonialData.quote as string,
                author: testimonialData.author as string,
              },
            });

            if (existing) {
              if (mode === 'overwrite') {
                await tx.testimonial.update({
                  where: { id: existing.id },
                  data: testimonialData as any,
                });
                summary.updated++;
              } else {
                summary.skipped++;
              }
            } else {
              await tx.testimonial.create({
                data: testimonialData as any,
              });
              summary.created++;
            }
          } catch (err) {
            summary.errors.push(`Testimonial ${testimonial.author}: ${err instanceof Error ? err.message : 'Unknown error'}`);
          }
        }
      }

      // Import FAQs (categories with items)
      if (Array.isArray(data.faqs)) {
        for (const category of data.faqs as Record<string, unknown>[]) {
          try {
            const { id, createdAt, updatedAt, items, ...categoryData } = category;
            const existing = await tx.fAQCategory.findFirst({
              where: { name: categoryData.name as string },
            });

            if (existing) {
              if (mode === 'overwrite') {
                await tx.fAQCategory.update({
                  where: { id: existing.id },
                  data: categoryData as any,
                });

                if (Array.isArray(items)) {
                  for (const faqItem of items as Record<string, unknown>[]) {
                    const { id: itemId, createdAt: itemCreatedAt, updatedAt: itemUpdatedAt, ...faqData } = faqItem;
                    const existingItem = await tx.fAQItem.findFirst({
                      where: { categoryId: existing.id, question: faqData.question as string },
                    });
                    if (existingItem) {
                      await tx.fAQItem.update({
                        where: { id: existingItem.id },
                        data: { ...faqData, categoryId: existing.id } as any,
                      });
                    } else {
                      await tx.fAQItem.create({
                        data: { ...faqData, categoryId: existing.id } as any,
                      });
                    }
                    summary.updated++;
                  }
                }
              } else {
                summary.skipped++;
              }
            } else {
              const createdCategory = await tx.fAQCategory.create({
                data: categoryData as any,
              });

              if (Array.isArray(items)) {
                for (const faqItem of items as Record<string, unknown>[]) {
                  const { id: itemId, createdAt: itemCreatedAt, updatedAt: itemUpdatedAt, ...faqData } = faqItem;
                  await tx.fAQItem.create({
                    data: { ...faqData, categoryId: createdCategory.id } as any,
                  });
                  summary.created++;
                }
              }
              summary.created++;
            }
          } catch (err) {
            summary.errors.push(`FAQCategory ${category.name}: ${err instanceof Error ? err.message : 'Unknown error'}`);
          }
        }
      }

      // Import PricingPlans
      if (Array.isArray(data.pricingPlans)) {
        for (const plan of data.pricingPlans as Record<string, unknown>[]) {
          try {
            const { id, createdAt, updatedAt, ...planData } = plan;
            const existing = await tx.pricingPlan.findFirst({
              where: {
                name: planData.name as string,
                period: planData.period as string,
              },
            });

            if (existing) {
              if (mode === 'overwrite') {
                await tx.pricingPlan.update({
                  where: { id: existing.id },
                  data: planData as any,
                });
                summary.updated++;
              } else {
                summary.skipped++;
              }
            } else {
              await tx.pricingPlan.create({
                data: planData as any,
              });
              summary.created++;
            }
          } catch (err) {
            summary.errors.push(`PricingPlan ${plan.name}: ${err instanceof Error ? err.message : 'Unknown error'}`);
          }
        }
      }

      // Import Redirects
      if (Array.isArray(data.redirects)) {
        for (const redirect of data.redirects as Record<string, unknown>[]) {
          try {
            const { id, createdAt, updatedAt, ...redirectData } = redirect;
            const existing = await tx.redirect.findUnique({
              where: { from: redirectData.from as string },
            });

            if (existing) {
              if (mode === 'overwrite') {
                await tx.redirect.update({
                  where: { id: existing.id },
                  data: redirectData as any,
                });
                summary.updated++;
              } else {
                summary.skipped++;
              }
            } else {
              await tx.redirect.create({
                data: redirectData as any,
              });
              summary.created++;
            }
          } catch (err) {
            summary.errors.push(`Redirect ${redirect.from}: ${err instanceof Error ? err.message : 'Unknown error'}`);
          }
        }
      }
    });

    await createAuditLog({
      userId: admin.id,
      userEmail: admin.email,
      action: 'IMPORT',
      entityType: 'ContentImport',
      entityId: 'full-import',
      entityName: 'Full Content Import',
      changes: { mode, summary },
    });

    return NextResponse.json({
      message: 'Import completed successfully',
      summary,
    });
  } catch (error) {
    console.error('Import error:', error);
    return NextResponse.json(
      {
        message: 'Failed to import content',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
