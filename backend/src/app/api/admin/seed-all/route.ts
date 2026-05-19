import { NextResponse } from 'next/server';
import { PrismaClient, Plan, Role, MemberRole, ListingStatus, OrderStatus, SyncStatus } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import * as fs from 'fs';
import * as path from 'path';

export const dynamic = 'force-dynamic';

const prisma = new PrismaClient();

const IMPORT_ORDER = [
  'siteSettings',
  'adminRole',
  'adminUser',
  'page',
  'pageSEO',
  'sectionContent',
  'navigationItem',
  'mediaAsset',
  'blogPost',
  'testimonial',
  'fAQCategory',
  'fAQItem',
  'pricingPlan',
  'redirect',
  'contentVersion',
  'user',
  'workspace',
  'workspaceMember',
  'ebayAccount',
  'listingTemplate',
  'listing',
  'listingImage',
  'listingSpecific',
  'listingVariation',
  'listingRevision',
  'order',
  'inventoryItem',
  'aILog',
  'notification',
  'jobQueue',
  'webhook',
  'refreshToken',
  'auditLog',
  'syncLog',
];

function getUniqueField(model: string, record: any): string | null {
  const map: Record<string, string> = {
    user: 'email',
    workspace: 'slug',
    order: 'ebayOrderId',
    page: 'slug',
    pageSEO: 'pageId',
    blogPost: 'slug',
    adminRole: 'name',
    adminUser: 'userId',
    refreshToken: 'token',
    redirect: 'from',
  };
  return map[model] || 'id';
}

export async function POST(request: Request) {
  const authHeader = request.headers.get('authorization');
  const seedToken = process.env.ADMIN_SEED_TOKEN;

  if (!seedToken || authHeader !== `Bearer ${seedToken}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const results: Record<string, { imported: number; skipped: number }> = {};
  const dataDir = path.join(process.cwd(), 'data-export');

  if (!fs.existsSync(dataDir)) {
    return NextResponse.json({ error: 'data-export/ directory not found. Push it to the repo first.' }, { status: 400 });
  }

  for (const model of IMPORT_ORDER) {
    const filePath = path.join(dataDir, `${model}.json`);
    if (!fs.existsSync(filePath)) continue;

    const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    if (data.length === 0) continue;

    let imported = 0;
    let skipped = 0;

    for (const record of data) {
      try {
        const uniqueField = getUniqueField(model, record);
        await (prisma as any)[model].upsert({
          where: { [uniqueField]: record[uniqueField] },
          update: record,
          create: record,
        });
        imported++;
      } catch (error: any) {
        if (error.code === 'P2002') skipped++;
      }
    }

    results[model] = { imported, skipped };
  }

  // Reset super admin password
  const adminPassword = process.env.SUPER_ADMIN_PASSWORD || 'EbayFlow@883';
  const hashedPassword = await bcrypt.hash(adminPassword, 12);
  await prisma.user.upsert({
    where: { email: 'contact@ebayflow.com' },
    update: { password: hashedPassword, role: Role.SUPER_ADMIN, isVerified: true },
    create: { email: 'contact@ebayflow.com', name: 'Super Admin', password: hashedPassword, role: Role.SUPER_ADMIN, isVerified: true },
  });

  // Count all models for verification
  const counts: Record<string, number> = {};
  for (const model of IMPORT_ORDER) {
    try {
      counts[model] = await (prisma as any)[model].count();
    } catch {
      counts[model] = 0;
    }
  }

  await prisma.$disconnect();

  return NextResponse.json({
    success: true,
    imported: results,
    liveCounts: counts,
    adminLogin: { email: 'contact@ebayflow.com', password: adminPassword },
  });
}
