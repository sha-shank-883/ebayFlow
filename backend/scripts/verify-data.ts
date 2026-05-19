import { PrismaClient } from '@prisma/client';

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

async function countAll(prisma: PrismaClient) {
  const counts: Record<string, number> = {};
  for (const model of MODELS) {
    try {
      counts[model] = await (prisma as any)[model].count();
    } catch {
      counts[model] = -1;
    }
  }
  return counts;
}

async function main() {
  const localUrl = process.env.LOCAL_DATABASE_URL;
  const liveUrl = process.env.DATABASE_URL;

  if (!localUrl || !liveUrl) {
    console.error('❌ Set LOCAL_DATABASE_URL and DATABASE_URL in .env');
    process.exit(1);
  }

  const localPrisma = new PrismaClient({ datasources: { db: { url: localUrl } } });
  const livePrisma = new PrismaClient({ datasources: { db: { url: liveUrl } } });

  console.log('📊 Counting local records...');
  const localCounts = await countAll(localPrisma);

  console.log('📊 Counting live records...');
  const liveCounts = await countAll(livePrisma);

  console.log('\n🔍 Comparison:');
  console.log('─'.repeat(50));
  console.log(`${'Model'.padEnd(25)} ${'Local'.padStart(8)} ${'Live'.padStart(8)} ${'Status'}`);
  console.log('─'.repeat(50));

  let allMatch = true;
  for (const model of MODELS) {
    const local = localCounts[model] ?? 0;
    const live = liveCounts[model] ?? 0;
    const match = local === live ? '✅' : '❌';
    if (local !== live) allMatch = false;
    console.log(`${model.padEnd(25)} ${String(local).padStart(8)} ${String(live).padStart(8)} ${match}`);
  }

  console.log('─'.repeat(50));
  console.log(allMatch ? '\n🎉 All data matches!' : '\n⚠️  Some data is missing on live.');

  await localPrisma.$disconnect();
  await livePrisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
