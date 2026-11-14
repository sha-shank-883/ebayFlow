// backend/scripts/test-smtp.js
const nodemailer = require('nodemailer');

const email = process.argv[2] || process.env.SMTP_USER;
const password = process.argv[3] || process.env.SMTP_PASS;
const targetHost = process.argv[4] || process.env.SMTP_HOST || 'smtp.zoho.com';
const targetPort = Number(process.argv[5] || process.env.SMTP_PORT || 465);

if (!email || !password) {
  console.error('\nUsage: node scripts/test-smtp.js <zoho-email> <password> [host] [port]');
  console.error('Example: node scripts/test-smtp.js info@ebayflow.com "your-app-password" smtp.zoho.com 465\n');
  process.exit(1);
}

async function testConnection(host, port, secure) {
  console.log(`\nTesting SMTP connection:`);
  console.log(`  Host:   ${host}`);
  console.log(`  Port:   ${port} (secure: ${secure})`);
  console.log(`  User:   ${email}`);

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: {
      user: email,
      pass: password,
    },
    connectionTimeout: 10000,
  });

  try {
    await transporter.verify();
    console.log(`  Result: [SUCCESS] Verified successfully!`);
    return true;
  } catch (err) {
    console.error(`  Result: [FAILED] - ${err.message}`);
    return false;
  }
}

async function run() {
  console.log('=== Zoho SMTP Diagnostic ===');
  
  // Try provided/default host and port
  let ok = await testConnection(targetHost, targetPort, targetPort === 465);
  if (ok) {
    console.log('\nReady! Zoho SMTP credentials are valid and working.');
    return;
  }

  // If failed on port 465, try port 587
  if (targetPort === 465) {
    console.log('\nTrying alternate port 587 (TLS)...');
    ok = await testConnection(targetHost, 587, false);
    if (ok) return;
  }

  // If domain might be registered under Zoho India or Zoho EU
  const otherHosts = ['smtp.zoho.in', 'smtp.zoho.eu'].filter(h => h !== targetHost);
  for (const altHost of otherHosts) {
    console.log(`\nTrying regional host ${altHost}...`);
    ok = await testConnection(altHost, 465, true);
    if (ok) return;
  }

  console.log('\nDiagnosis hints:');
  console.log('1. Verify your Zoho email address matches the account this password was created for.');
  console.log('2. If Two-Factor Authentication is enabled in Zoho, this password MUST be an "Application-Specific Password" created in Zoho Accounts -> Security -> App Passwords.');
  console.log('3. Ensure "SMTP Access" is enabled in Zoho Mail Settings -> Mail Accounts -> Email Access (IMAP/POP/SMTP).');
}

run();

