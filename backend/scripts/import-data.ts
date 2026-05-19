import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();
const DATA_DIR = path.join(__dirname, '..', 'data-export');

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
  'contentAudit',
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

async function importData() {
  if (!fs.existsSync(DATA_DIR)) {
    console.error(`❌ Directory not found: ${DATA_DIR}`);
    console.log('Run export-data.ts first on your local machine.');
    process.exit(1);
  }

  const summary: Record<string, { imported: number; skipped: number; error?: string }> = {};

  for (const model of IMPORT_ORDER) {
    const filePath = path.join(DATA_DIR, `${model}.json`);

    if (!fs.existsSync(filePath)) {
      console.log(`⚠️  ${model}: no export file, skipping`);
      continue;
    }

    const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

    if (data.length === 0) {
      console.log(`⚠️  ${model}: empty data, skipping`);
      continue;
    }

    let imported = 0;
    let skipped = 0;

    try {
      for (const record of data) {
        try {
          // For users, always update password to ensure it works
          if (model === 'user') {
            await (prisma as any)[model].upsert({
              where: { email: record.email },
              update: record,
              create: record,
            });
            imported++;
            continue;
          }

          // For models with unique constraints, use upsert
          const uniqueField = getUniqueField(model, record);
          if (uniqueField) {
            await (prisma as any)[model].upsert({
              where: { [uniqueField]: record[uniqueField] },
              update: record,
              create: record,
            });
            imported++;
          } else {
            // No unique field, try create (will skip if exists)
            await (prisma as any)[model].create({
              data: record,
            });
            imported++;
          }
        } catch (error: any) {
          if (error.code === 'P2002') {
            skipped++;
          } else {
            console.error(`❌ ${model} record ${record.id}: ${error.message}`);
          }
        }
      }

      summary[model] = { imported, skipped };
      console.log(`✅ ${model}: ${imported} imported, ${skipped} skipped`);
    } catch (error: any) {
      summary[model] = { imported, skipped, error: error.message };
      console.error(`❌ ${model} batch failed: ${error.message}`);
    }
  }

  // Reset super admin password to ensure login works
  const adminPassword = process.env.SUPER_ADMIN_PASSWORD || 'EbayFlow@883';
  const hashedPassword = await bcrypt.hash(adminPassword, 12);
  await prisma.user.updateMany({
    where: { email: 'contact@ebayflow.com' },
    data: { password: hashedPassword, role: 'SUPER_ADMIN', isVerified: true },
  });
  console.log(`\n✅ Super admin password set to: ${adminPassword}`);

  console.log('\n📊 Import Summary:');
  console.log(JSON.stringify(summary, null, 2));

  await prisma.$disconnect();
}

function getUniqueField(model: string, record: any): string | null {
  const uniqueFields: Record<string, string> = {
    user: 'email',
    workspace: 'slug',
    workspaceMember: 'id',
    ebayAccount: 'id',
    listing: 'id',
    listingImage: 'id',
    listingSpecific: 'id',
    listingVariation: 'id',
    listingRevision: 'id',
    listingTemplate: 'id',
    order: 'ebayOrderId',
    inventoryItem: 'id',
    aILog: 'id',
    notification: 'id',
    jobQueue: 'id',
    webhook: 'id',
    refreshToken: 'token',
    auditLog: 'id',
    syncLog: 'id',
    siteSettings: 'id',
    page: 'slug',
    pageSEO: 'pageId',
    sectionContent: 'id',
    navigationItem: 'id',
    mediaAsset: 'id',
    blogPost: 'slug',
    testimonial: 'id',
    fAQCategory: 'id',
    fAQItem: 'id',
    pricingPlan: 'id',
    redirect: 'from',
    contentAudit: 'id',
    adminRole: 'name',
    adminUser: 'userId',
    contentVersion: 'id',
  };
  return uniqueFields[model] || null;
}

importData().catch((e) => {
  console.error(e);
  process.exit(1);
});
