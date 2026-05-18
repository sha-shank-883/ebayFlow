const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const result = await prisma.ebayAccount.deleteMany({});
  console.log('Cleared all eBay accounts. Deleted count:', result.count);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
