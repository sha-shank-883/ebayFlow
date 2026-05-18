
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    const accounts = await prisma.ebayAccount.findMany();
    console.log(`Found ${accounts.length} eBay Accounts`);
    for (const acc of accounts) {
      console.log(`- Account ID: ${acc.id}`);
      console.log(`  Username: ${acc.username}`);
      console.log(`  Token Expiry: ${acc.tokenExpiry}`);
      const listings = await prisma.listing.count({ where: { ebayAccountId: acc.id } });
      console.log(`  Listings in DB: ${listings}`);
    }
    const totalOrders = await prisma.order.count();
    console.log(`Total Orders in DB: ${totalOrders}`);
  } catch (err) {
    console.error('Error details:', err);
  }
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
