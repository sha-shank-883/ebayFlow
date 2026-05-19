import { PrismaClient, Plan, Role, MemberRole } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function seedSuperAdmin() {
  const email = 'contact@ebayflow.com';
  const password = process.env.SUPER_ADMIN_PASSWORD || 'EbayFlow@883';

  try {
    const existing = await prisma.user.findUnique({ where: { email } });

    if (existing) {
      const hashedPassword = await bcrypt.hash(password, 12);
      await prisma.user.update({
        where: { email },
        data: { role: Role.SUPER_ADMIN, password: hashedPassword },
      });
      console.log('✅ Super Admin password reset for', email);
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    await prisma.user.create({
      data: {
        email,
        name: 'Super Admin',
        password: hashedPassword,
        role: Role.SUPER_ADMIN,
        isVerified: true,
      },
    });
    console.log('✅ Super Admin created:', email);
  } catch (error: any) {
    console.error('❌ Failed to seed super admin:', error.message);
  }
}

async function seedWorkspace() {
  try {
    const existing = await prisma.workspace.findFirst({
      where: { slug: 'demo-store' },
    });

    if (existing) {
      console.log('ℹ️  Demo workspace already exists');
      return;
    }

    const admin = await prisma.user.findUnique({ where: { email: 'contact@ebayflow.com' } });
    if (!admin) {
      console.log('⚠️  Skipping workspace — super admin not found');
      return;
    }

    const workspace = await prisma.workspace.create({
      data: {
        name: 'SellerFlow Demo Store',
        slug: 'demo-store',
        plan: Plan.PROFESSIONAL,
        listingsLimit: 1000,
        accountsLimit: 5,
        aiCreditsLimit: 500,
      },
    });

    await prisma.workspaceMember.create({
      data: {
        userId: admin.id,
        workspaceId: workspace.id,
        role: MemberRole.OWNER,
      },
    });
    console.log('✅ Demo workspace created');
  } catch (error: any) {
    console.error('❌ Failed to seed workspace:', error.message);
  }
}

async function main() {
  console.log('🌱 Running minimal seed...');
  await seedSuperAdmin();
  await seedWorkspace();
  console.log('🎉 Minimal seed complete');
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
