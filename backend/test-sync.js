
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const accountId = 'cmp691dlj000113mraor2v0kp';
  const account = await prisma.ebayAccount.findUnique({
    where: { id: accountId }
  });

  if (!account) {
    console.error('Account not found');
    return;
  }

  const isSandbox = true; // Hardcoded for now
  const apiBase = isSandbox ? 'https://api.sandbox.ebay.com' : 'https://api.ebay.com';
  const accessToken = account.accessToken;

  console.log('Testing eBay Inventory API for account:', account.username);
  console.log('API Base:', apiBase);

  try {
    const response = await fetch(`${apiBase}/sell/inventory/v1/inventory_item?offset=0&limit=10`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json',
        'Content-Language': 'en-GB',
        'Accept-Language': 'en-GB'
      }
    });

    console.log('Status:', response.status);
    const text = await response.text();
    console.log('Response:', text);
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
