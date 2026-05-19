import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();
const OUTPUT_DIR = path.join(__dirname, '..', 'data-export');

const MODELS = [
  'user',
  'workspace',
  'workspaceMember',
  'ebayAccount',
  'listing',
  'listingImage',
  'listingSpecific',
  'listingVariation',
  'listingRevision',
  'listingTemplate',
  'order',
  'inventoryItem',
  'aILog',
  'notification',
  'jobQueue',
  'webhook',
  'refreshToken',
  'auditLog',
  'syncLog',
  'siteSettings',
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
  'adminRole',
  'adminUser',
  'contentVersion',
];

async function exportData() {
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  const summary: Record<string, number> = {};

  for (const model of MODELS) {
    try {
      const data = await (prisma as any)[model].findMany({
        orderBy: { id: 'asc' },
      });

      if (data.length > 0) {
        const filePath = path.join(OUTPUT_DIR, `${model}.json`);
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
        summary[model] = data.length;
        console.log(`✅ ${model}: ${data.length} records → ${model}.json`);
      } else {
        console.log(`⚠️  ${model}: empty, skipping`);
      }
    } catch (error: any) {
      console.error(`❌ ${model}: ${error.message}`);
    }
  }

  // Write summary
  fs.writeFileSync(
    path.join(OUTPUT_DIR, 'summary.json'),
    JSON.stringify(summary, null, 2)
  );

  console.log('\n📊 Export Summary:');
  console.log(JSON.stringify(summary, null, 2));
  console.log(`\n📁 Files saved to: ${OUTPUT_DIR}`);

  await prisma.$disconnect();
}

exportData().catch((e) => {
  console.error(e);
  process.exit(1);
});
