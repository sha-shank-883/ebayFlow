import { PrismaClient, Plan, Role, MemberRole, ListingStatus, OrderStatus } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { subDays } from 'date-fns';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting seeding...');

  // ============================================
  // 1. CORE DATA (existing - safe to re-seed)
  // ============================================
  await prisma.auditLog.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.order.deleteMany();
  await prisma.listing.deleteMany();
  await prisma.inventoryItem.deleteMany();
  await prisma.ebayAccount.deleteMany();
  await prisma.workspaceMember.deleteMany();
  await prisma.workspace.deleteMany();

  // Create Demo User
  const hashedPassword = await bcrypt.hash('password123', 10);
  const demoUser = await prisma.user.upsert({
    where: { email: 'demo@sellerflow.ai' },
    update: {},
    create: {
      email: 'demo@sellerflow.ai',
      name: 'Demo Seller',
      password: hashedPassword,
      role: Role.USER,
      isVerified: true,
    },
  });

  // Create SUPER_ADMIN
  const superAdminPassword = await bcrypt.hash(process.env.SUPER_ADMIN_PASSWORD || 'EbayFlow@883', 10);
  const superAdmin = await prisma.user.upsert({
    where: { email: 'contact@ebayflow.com' },
    update: { role: Role.SUPER_ADMIN },
    create: {
      email: 'contact@ebayflow.com',
      name: 'Super Admin',
      password: superAdminPassword,
      role: Role.SUPER_ADMIN,
      isVerified: true,
    },
  });
  console.log('✅ Super Admin created: contact@ebayflow.com');

  // Create Demo Workspace
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
    data: { workspaceId: workspace.id, userId: demoUser.id, role: MemberRole.OWNER },
  });

  // Create Mock eBay Account
  const ebayAccount = await prisma.ebayAccount.create({
    data: {
      workspaceId: workspace.id,
      ebayUserId: 'demo_ebay_uk',
      username: 'DemoSellerUK',
      accessToken: 'mock_access_token',
      refreshToken: 'mock_refresh_token',
      tokenExpiry: new Date(Date.now() + 3600000),
      marketplace: 'EBAY_GB',
      feedbackScore: 1250,
      feedbackPercent: 99.8,
      sellerLevel: 'TOP_RATED',
      activeListings: 15,
      totalSales: 45000.50,
      isActive: true,
    },
  });

  // Create Sample Inventory
  const inventoryData = [
    { sku: 'TECH-001', name: 'Premium Noise Cancelling Headphones', quantity: 45, lowStockThreshold: 10, costPrice: 85.00 },
    { sku: 'TECH-002', name: 'Wireless Mechanical Keyboard', quantity: 12, lowStockThreshold: 5, costPrice: 45.50 },
    { sku: 'HOME-001', name: 'Ergonomic Office Chair', quantity: 8, lowStockThreshold: 10, costPrice: 120.00 },
    { sku: 'HOME-002', name: 'Smart LED Desk Lamp', quantity: 60, lowStockThreshold: 15, costPrice: 15.00 },
    { sku: 'FASH-001', name: 'Cotton Minimalist Hoodie', quantity: 120, lowStockThreshold: 20, costPrice: 22.00 },
  ];
  for (const item of inventoryData) {
    await prisma.inventoryItem.create({ data: { ...item, workspaceId: workspace.id } });
  }

  // Create Sample Listings
  const listingData = [
    { title: 'Premium Wireless Headphones - Noise Cancelling', price: 149.99, quantity: 10, sku: 'TECH-001', status: ListingStatus.ACTIVE },
    { title: 'Mechanical Keyboard RGB Backlit - Blue Switches', price: 89.99, quantity: 5, sku: 'TECH-002', status: ListingStatus.ACTIVE },
    { title: 'Modern Ergonomic Office Chair - Grey', price: 249.99, quantity: 2, sku: 'HOME-001', status: ListingStatus.ACTIVE },
    { title: 'Smart LED Lamp with Wireless Charger', price: 45.00, quantity: 15, sku: 'HOME-002', status: ListingStatus.DRAFT },
    { title: 'Oversized Cotton Hoodie - Midnight Black', price: 39.99, quantity: 50, sku: 'FASH-001', status: ListingStatus.ACTIVE },
  ];
  for (const listing of listingData) {
    await prisma.listing.create({
      data: { ...listing, workspaceId: workspace.id, ebayAccountId: ebayAccount.id, ebayItemId: Math.random().toString(36).substring(7), currency: 'GBP' },
    });
  }

  // Create Sample Orders
  const now = new Date();
  for (let i = 0; i < 20; i++) {
    const daysAgo = Math.floor(Math.random() * 30);
    const orderDate = subDays(now, daysAgo);
    const total = parseFloat((Math.random() * 200 + 20).toFixed(2));
    await prisma.order.create({
      data: {
        workspaceId: workspace.id,
        ebayAccountId: ebayAccount.id,
        ebayOrderId: `EB-${Math.random().toString().substring(2, 10)}`,
        buyerUsername: `buyer_${i}`,
        total,
        subtotal: total * 0.8,
        netProfit: parseFloat((total * 0.25).toFixed(2)),
        status: OrderStatus.DELIVERED,
        currency: 'GBP',
        items: [{ title: 'Sample Product', quantity: 1, price: total }],
        createdAt: orderDate,
        ebayCreatedAt: orderDate,
      },
    });
  }

  // ============================================
  // 2. WEBSITE MANAGEMENT DATA (upsert - preserves edits)
  // ============================================
  console.log('\n🌐 Seeding website management data...');

  // Site Settings
  await prisma.siteSettings.upsert({
    where: { id: 'default' },
    update: {},
    create: {
      id: 'default',
      siteName: 'eBay Flow AI',
      tagline: 'AI-Powered eBay Listing Management & Automation for Global Sellers',
      contactEmail: 'hello@ebayflow.ai',
      contactPhone: '+1 (555) 123-4567',
      contactAddress: '123 Market Street, San Francisco, CA 94105, United States',
      socialLinks: { twitter: 'https://twitter.com/ebayflowai', github: 'https://github.com/ebayflow-ai' },
    },
  });
  console.log('✅ Site Settings seeded');

  // ---- HOME PAGE ----
  const homePage = await prisma.page.upsert({
    where: { slug: 'home' },
    update: {},
    create: { slug: 'home', title: 'Home', description: 'AI-Powered eBay Listing Management', template: 'default', sortOrder: 1 },
  });

  // Hero Section (with preview dashboard data)
  await prisma.sectionContent.upsert({
    where: { pageId_sectionKey: { pageId: homePage.id, sectionKey: 'hero' } },
    update: {},
    create: {
      pageId: homePage.id,
      sectionKey: 'hero',
      sectionType: 'hero',
      title: 'The Enterprise AI Engine for',
      subtitle: 'eBay Sellers Worldwide',
      content: {
        badge: 'Scale Your eBay Business Globally',
        description: 'Automate listing creation, optimize for eBay SEO, and sync inventory in real-time. The only listing management tool built specifically for high-volume eBay marketplaces worldwide.',
        cta: 'Start Your Free Audit',
        ctaLink: '/register',
        secondaryCta: 'View Case Studies',
        secondaryCtaLink: '/case-studies',
        stats: [
          { label: 'Global Sellers', value: '5,000+' },
          { label: 'Listings Optimized', value: '1.2M+' },
          { label: 'Avg. Sales Growth', value: '34%' },
          { label: 'Uptime Guarantee', value: '99.99%' },
        ],
        preview: {
          revenue: '$42,850.00',
          revenueGrowth: '+12.5% vs last month',
          listings: '1,248',
          listingStatus: '98% SEO Optimized',
          roi: '3.4x',
          syncSpeed: '250ms',
        },
      },
      order: 1,
    },
  });

  // Features Section
  await prisma.sectionContent.upsert({
    where: { pageId_sectionKey: { pageId: homePage.id, sectionKey: 'features' } },
    update: {},
    create: {
      pageId: homePage.id,
      sectionKey: 'features',
      sectionType: 'features',
      title: 'Precision Engineering for',
      subtitle: 'Global eBay Dominance',
      content: {
        badge: 'Enterprise Capabilities',
        description: "We've built the most advanced toolset for eBay sellers worldwide. Automate the mundane, optimize for the algorithm, and scale without limits.",
        items: [
          { title: 'AI Listing Optimization', description: 'Our AI analyzes thousands of top-performing listings globally to generate titles and descriptions that convert.', icon: 'Sparkles' },
          { title: 'Bulk Inventory Sync', description: 'Real-time synchronization across multiple eBay accounts and warehouses with millisecond latency.', icon: 'RefreshCw' },
          { title: 'eBay SEO Dominance', description: "Proprietary algorithms designed for eBay's 'Best Match' search system to keep you at the top across all marketplaces.", icon: 'TrendingUp' },
          { title: 'Automated Fulfillment', description: 'Streamline your shipping with direct integrations into major carriers worldwide including USPS, FedEx, DHL, and more.', icon: 'Truck' },
        ],
      },
      order: 2,
    },
  });

  // How It Works Section
  await prisma.sectionContent.upsert({
    where: { pageId_sectionKey: { pageId: homePage.id, sectionKey: 'how-it-works' } },
    update: {},
    create: {
      pageId: homePage.id,
      sectionKey: 'how-it-works',
      sectionType: 'how-it-works',
      title: 'Get Started in',
      subtitle: '3 Easy Steps',
      content: {
        badge: 'Simple Setup',
        description: 'No complex setup, no technical knowledge required. Start optimizing your eBay business in minutes.',
        steps: [
          { icon: 'Upload', title: 'Connect Your eBay Account', description: 'Securely link your eBay seller account in under 2 minutes. We support multiple accounts and all eBay marketplaces worldwide.', details: ['One-click OAuth connection', 'No passwords stored', 'Bank-level encryption', 'Instant sync of existing listings'] },
          { icon: 'Wand2', title: 'AI Optimizes Your Listings', description: 'Our AI analyzes millions of successful listings to generate optimized titles, descriptions, and pricing recommendations automatically.', details: ['SEO-optimized titles', 'Compelling descriptions', 'Competitive pricing analysis', 'Image enhancement suggestions'] },
          { icon: 'Rocket', title: 'Publish & Scale', description: 'Publish optimized listings instantly and watch your visibility and sales grow. Monitor performance with real-time analytics.', details: ['One-click publish to eBay', 'Bulk listing operations', 'Real-time performance tracking', 'Automated repricing'] },
        ],
      },
      order: 3,
    },
  });

  // Testimonials Section
  await prisma.sectionContent.upsert({
    where: { pageId_sectionKey: { pageId: homePage.id, sectionKey: 'testimonials' } },
    update: {},
    create: {
      pageId: homePage.id,
      sectionKey: 'testimonials',
      sectionType: 'testimonials',
      title: 'Trusted by',
      subtitle: '10,000+ Sellers',
      content: {
        badge: 'Loved by Sellers',
        description: 'See why thousands of eBay sellers worldwide choose eBay Flow to power their business.',
      },
      order: 4,
    },
  });

  // Pricing Preview Section
  await prisma.sectionContent.upsert({
    where: { pageId_sectionKey: { pageId: homePage.id, sectionKey: 'pricing-preview' } },
    update: {},
    create: {
      pageId: homePage.id,
      sectionKey: 'pricing-preview',
      sectionType: 'pricing',
      title: 'Invest in Your',
      subtitle: 'eBay Empire',
      content: {
        badge: 'Flexible Plans',
        description: 'Transparent pricing tailored for eBay sellers of all sizes worldwide. No hidden fees, no credit card required to start.',
      },
      order: 5,
    },
  });

  // CTA Section
  await prisma.sectionContent.upsert({
    where: { pageId_sectionKey: { pageId: homePage.id, sectionKey: 'cta' } },
    update: {},
    create: {
      pageId: homePage.id,
      sectionKey: 'cta',
      sectionType: 'cta',
      title: 'Scale Your Global Business',
      subtitle: 'at the Speed of AI',
      content: {
        badge: 'Join the eBay Revolution',
        description: "Experience the enterprise listing engine trusted by top retailers worldwide. Start your 14-day masterclass in automation today.",
        primaryCta: 'Get Started Now',
        primaryCtaLink: '/register',
        secondaryCta: 'Talk to Sales',
        secondaryCtaLink: '/contact',
        benefits: ['Instant Setup', 'No Card Required', 'Cancel Anytime'],
      },
      order: 6,
    },
  });

  // CTA Benefits Section
  await prisma.sectionContent.upsert({
    where: { pageId_sectionKey: { pageId: homePage.id, sectionKey: 'cta-benefits' } },
    update: {},
    create: {
      pageId: homePage.id,
      sectionKey: 'cta-benefits',
      sectionType: 'custom',
      content: {
        benefits: ['Instant Setup', 'No Card Required', 'Cancel Anytime'],
      },
      order: 7,
    },
  });

  // Audit Section
  await prisma.sectionContent.upsert({
    where: { pageId_sectionKey: { pageId: homePage.id, sectionKey: 'audit' } },
    update: {},
    create: {
      pageId: homePage.id,
      sectionKey: 'audit',
      sectionType: 'audit',
      title: 'Is Your eBay Store Performing',
      subtitle: 'at its Peak?',
      content: {
        badge: 'Exclusive for eBay Sellers',
        description: "Our AI diagnostic tool analyzes your listings against the latest eBay 'Best Match' algorithms. Get a comprehensive report on your SEO, pricing, and conversion health.",
        features: [
          { icon: 'BarChart3', title: 'Detailed Sales Gap Analysis', description: 'See exactly where you\'re losing out to competitors in global search results.' },
          { icon: 'ShieldCheck', title: 'Listing Health Check', description: 'We scan for missing item specifics and title optimization errors.' },
          { icon: 'Zap', title: 'Instant Scaling Roadmap', description: 'Receive a step-by-step plan to automate your growth with eBay Flow.' },
        ],
        formTitle: 'Get Your Free eBay Audit',
        formDescription: 'Discover hidden optimization opportunities. Our specialists will review your current listing performance.',
      },
      order: 8,
    },
  });

  // Audit Features Section
  await prisma.sectionContent.upsert({
    where: { pageId_sectionKey: { pageId: homePage.id, sectionKey: 'audit-features' } },
    update: {},
    create: {
      pageId: homePage.id,
      sectionKey: 'audit-features',
      sectionType: 'custom',
      content: {
        features: [
          { icon: 'BarChart3', title: 'Detailed Sales Gap Analysis', description: 'See exactly where you\'re losing out to competitors in global search results.' },
          { icon: 'ShieldCheck', title: 'Listing Health Check', description: 'We scan for missing item specifics and title optimization errors.' },
          { icon: 'Zap', title: 'Instant Scaling Roadmap', description: 'Receive a step-by-step plan to automate your growth with eBay Flow.' },
        ],
      },
      order: 9,
    },
  });

  // Audit Form Section
  await prisma.sectionContent.upsert({
    where: { pageId_sectionKey: { pageId: homePage.id, sectionKey: 'audit-form' } },
    update: {},
    create: {
      pageId: homePage.id,
      sectionKey: 'audit-form',
      sectionType: 'custom',
      content: {
        title: 'Get Your Free eBay Audit',
        description: 'Discover hidden optimization opportunities. Our specialists will review your current listing performance.',
        successTitle: 'Request Received',
        successDescription: 'Our eBay specialists will analyze your store and contact you within 24 hours with your free audit.',
        fields: {
          name: { label: 'Full Name', placeholder: 'John Smith' },
          email: { label: 'Work Email', placeholder: 'john@company.com' },
          business: { label: 'Business Name', placeholder: 'Enterprise Sellers Ltd' },
          url: { label: 'eBay Store URL (Optional)', placeholder: 'ebay.com/str/yourstore' },
        },
        cta: 'Claim My Free Audit',
        loadingCta: 'Analyzing...',
        guarantees: ['No Obligation', 'Global Support Team', 'GDPR Compliant'],
      },
      order: 10,
    },
  });

  // Trust Signals Section
  await prisma.sectionContent.upsert({
    where: { pageId_sectionKey: { pageId: homePage.id, sectionKey: 'trust-signals' } },
    update: {},
    create: {
      pageId: homePage.id,
      sectionKey: 'trust-signals',
      sectionType: 'custom',
      content: {
        trustSignals: [
          { label: 'eBay Solution Partner', icon: 'CheckCircle2', color: 'text-blue-500' },
          { label: 'Global Support', icon: 'Shield', color: 'text-blue-500' },
          { label: '4.9/5 Trustpilot', icon: 'Star', color: 'text-yellow-500' },
        ],
      },
      order: 11,
    },
  });

  // Logos Section
  await prisma.sectionContent.upsert({
    where: { pageId_sectionKey: { pageId: homePage.id, sectionKey: 'logos' } },
    update: {},
    create: {
      pageId: homePage.id,
      sectionKey: 'logos',
      sectionType: 'custom',
      content: {
        logos: [
          { name: 'eBay', color: 'text-[#E53238]' },
          { name: 'PayPal', color: 'text-[#003087]' },
          { name: 'Shopify', color: 'text-[#96BF48]' },
          { name: 'USPS', color: 'text-[#333366]' },
          { name: 'FedEx', color: 'text-[#4D148C]' },
          { name: 'Stripe', color: 'text-[#635BFF]' },
        ],
      },
      order: 12,
    },
  });

  console.log('✅ Home page sections seeded');

  // ---- HOME PAGE SEO ----
  await prisma.pageSEO.upsert({
    where: { pageId: homePage.id },
    update: {},
    create: {
      pageId: homePage.id,
      metaTitle: 'eBay Flow AI - AI-Powered eBay Listing Management for Global Sellers',
      metaDescription: 'Automate listing creation, optimize for eBay SEO, and sync inventory in real-time. The only listing management tool built for high-volume eBay marketplaces worldwide.',
      metaKeywords: 'eBay listing tool, eBay SEO, AI listing optimization, inventory management, global eBay',
      ogTitle: 'eBay Flow AI - Scale Your eBay Business Globally',
      ogDescription: 'AI-powered listing management, SEO optimization, and inventory sync for eBay sellers worldwide.',
    },
  });

  // ---- ABOUT PAGE ----
  const aboutPage = await prisma.page.upsert({
    where: { slug: 'about' },
    update: {},
    create: { slug: 'about', title: 'About Us', template: 'default', sortOrder: 2 },
  });

  // About Content (mission/vision combined)
  await prisma.sectionContent.upsert({
    where: { pageId_sectionKey: { pageId: aboutPage.id, sectionKey: 'about-content' } },
    update: {},
    create: {
      pageId: aboutPage.id,
      sectionKey: 'about-content',
      sectionType: 'custom-html',
      content: {
        mission: { title: 'Our Mission', description: 'To democratize enterprise-grade automation for eBay sellers worldwide. We believe that small businesses should have access to the same AI-powered optimization as global retail giants.' },
        vision: { title: 'Our Vision', description: 'To become the operating system for modern e-commerce. A world where listing, inventory, and fulfillment happen autonomously, letting you focus on strategy and growth.' },
      },
      order: 1,
    },
  });

  // About Values Section
  await prisma.sectionContent.upsert({
    where: { pageId_sectionKey: { pageId: aboutPage.id, sectionKey: 'values' } },
    update: {},
    create: {
      pageId: aboutPage.id,
      sectionKey: 'values',
      sectionType: 'custom',
      content: {
        values: [
          { icon: 'Target', title: 'Customer Obsession', description: "Every feature we build starts with our customers' needs. We listen, iterate, and deliver solutions that make a real difference to your business." },
          { icon: 'Heart', title: 'Integrity First', description: 'Transparent pricing, honest communication, and ethical data practices. We believe trust is the foundation of every great business relationship.' },
          { icon: 'Users', title: 'Collaborative Spirit', description: "We work closely with our community of sellers to understand challenges and co-create solutions. Your success is our success." },
          { icon: 'Award', title: 'Relentless Innovation', description: "We push the boundaries of what's possible with AI and automation. Our team is constantly exploring new ways to help you sell smarter." },
        ],
      },
      order: 2,
    },
  });

  // About Milestones Section
  await prisma.sectionContent.upsert({
    where: { pageId_sectionKey: { pageId: aboutPage.id, sectionKey: 'milestones' } },
    update: {},
    create: {
      pageId: aboutPage.id,
      sectionKey: 'milestones',
      sectionType: 'custom',
      content: {
        milestones: [
          { year: '2022', event: 'eBay Flow AI founded', detail: 'Started with a mission to help eBay sellers leverage AI' },
          { year: '2023', event: 'Series A Funding', detail: 'Raised $5M to expand our platform and team' },
          { year: '2024', event: '10,000+ sellers milestone', detail: 'Became the #1 AI-powered eBay tool globally' },
          { year: '2025', event: 'Global expansion', detail: 'Now serving sellers across US, UK, EU, Australia, and beyond' },
        ],
      },
      order: 3,
    },
  });

  await prisma.pageSEO.upsert({
    where: { pageId: aboutPage.id },
    update: {},
    create: {
      pageId: aboutPage.id,
      metaTitle: 'About eBay Flow AI - Built by Sellers, for Sellers',
      metaDescription: 'Learn about our mission to empower eBay sellers worldwide with enterprise-grade AI tools. From startup to global.',
    },
  });

  console.log('✅ About page seeded');

  // ---- CONTACT PAGE ----
  const contactPage = await prisma.page.upsert({
    where: { slug: 'contact' },
    update: {},
    create: { slug: 'contact', title: 'Contact Us', template: 'default', sortOrder: 3 },
  });

  // Contact Content
  await prisma.sectionContent.upsert({
    where: { pageId_sectionKey: { pageId: contactPage.id, sectionKey: 'contact-content' } },
    update: {},
    create: {
      pageId: contactPage.id,
      sectionKey: 'contact-content',
      sectionType: 'custom-html',
      content: {
        badge: 'Contact Us',
        title: 'Get in',
        titleAccent: 'Touch',
        description: 'Have a question, feedback, or need help? Our global team typically responds within 24 hours.',
        formTitle: 'Send us a message',
        infoTitle: 'Contact Information',
        hours: { title: 'Business Hours', detail: 'Mon-Fri: 9:00 AM - 6:00 PM GMT', weekend: 'Sat-Sun: Closed' },
        immediate: { title: 'Need Immediate Help?', description: 'Check our help center for instant answers to common questions.', linkText: 'Visit Help Center' },
      },
      order: 1,
    },
  });

  // Contact Form Schema Section
  await prisma.sectionContent.upsert({
    where: { pageId_sectionKey: { pageId: contactPage.id, sectionKey: 'form-schema' } },
    update: {},
    create: {
      pageId: contactPage.id,
      sectionKey: 'form-schema',
      sectionType: 'custom',
      content: {
        title: 'Send us a message',
        fields: {
          name: { label: 'Full Name', placeholder: 'John Smith' },
          email: { label: 'Work Email', placeholder: 'john@company.com' },
          company: { label: 'Company (Optional)', placeholder: 'Enterprise Sellers Ltd' },
          subject: {
            label: 'Subject',
            placeholder: 'Select a topic',
            options: [
              { label: 'General Inquiry', value: 'general' },
              { label: 'Sales Question', value: 'sales' },
              { label: 'Technical Support', value: 'support' },
              { label: 'Partnership', value: 'partnership' },
              { label: 'Feedback', value: 'feedback' },
            ],
          },
          message: { label: 'Message', placeholder: 'Tell us how we can help...' },
        },
        cta: 'Send Message',
        loadingCta: 'Sending...',
        success: "Message sent! We'll get back to you within 24 hours.",
      },
      order: 2,
    },
  });

  // Contact Info Card Section
  await prisma.sectionContent.upsert({
    where: { pageId_sectionKey: { pageId: contactPage.id, sectionKey: 'contact-info' } },
    update: {},
    create: {
      pageId: contactPage.id,
      sectionKey: 'contact-info',
      sectionType: 'custom',
      content: {
        title: 'Contact Information',
        email: 'hello@ebayflow.ai',
        phone: '+44 20 8123 4567',
        address: {
          line1: '123 Market Street',
          city: 'San Francisco',
          postcode: 'CA 94105',
          country: 'United States',
        },
        hours: {
          title: 'Business Hours',
          detail: 'Mon-Fri: 9:00 AM - 6:00 PM PST',
          weekend: 'Sat-Sun: Closed',
        },
        immediate: {
          title: 'Need Immediate Help?',
          description: 'Check our help center for instant answers to common questions.',
          linkText: 'Visit Help Center',
        },
      },
      order: 3,
    },
  });

  await prisma.pageSEO.upsert({
    where: { pageId: contactPage.id },
    update: {},
    create: {
      pageId: contactPage.id,
      metaTitle: 'Contact eBay Flow AI - Global Support',
      metaDescription: 'Get in touch with our global team. We respond within 24 hours.',
    },
  });

  console.log('✅ Contact page seeded');

  // ---- PRICING PAGE ----
  const pricingPage = await prisma.page.upsert({
    where: { slug: 'pricing' },
    update: {},
    create: { slug: 'pricing', title: 'Pricing', template: 'default', sortOrder: 4 },
  });

  // Pricing Guarantees Section
  await prisma.sectionContent.upsert({
    where: { pageId_sectionKey: { pageId: pricingPage.id, sectionKey: 'guarantees' } },
    update: {},
    create: {
      pageId: pricingPage.id,
      sectionKey: 'guarantees',
      sectionType: 'custom',
      content: {
        guarantees: [
          { title: '30-Day Money Back', description: "Full refund if you're not satisfied within the first 30 days.", icon: 'ShieldCheck' },
          { title: 'No Hidden Fees', description: 'The price you see is the price you pay. Always.', icon: 'CreditCard' },
          { title: '24/7 Support', description: 'Our team is always here to help when you need it.', icon: 'Headphones' },
        ],
      },
      order: 1,
    },
  });

  // Pricing Trust Signals Section
  await prisma.sectionContent.upsert({
    where: { pageId_sectionKey: { pageId: pricingPage.id, sectionKey: 'trust-signals' } },
    update: {},
    create: {
      pageId: pricingPage.id,
      sectionKey: 'trust-signals',
      sectionType: 'custom',
      content: {
        badge: 'Save 20%',
        trustSignals: [
          { label: 'Safe & Secure', value: '100%' },
          { label: 'Support', value: '24/7' },
          { label: 'Commission', value: '0%' },
        ],
        ctaText: 'Have questions?',
        ctaLinkText: 'Chat with our team',
      },
      order: 2,
    },
  });

  // Pricing FAQs Section
  await prisma.sectionContent.upsert({
    where: { pageId_sectionKey: { pageId: pricingPage.id, sectionKey: 'faqs' } },
    update: {},
    create: {
      pageId: pricingPage.id,
      sectionKey: 'faqs',
      sectionType: 'custom',
      content: {
        faqs: [
          { q: 'Can I switch plans later?', a: 'Yes, you can upgrade or downgrade at any time. Changes take effect immediately for upgrades and at the next billing cycle for downgrades.' },
          { q: 'What happens to my data if I cancel?', a: 'Your data is preserved for 30 days after cancellation. You can reactivate your account anytime within this period and everything will be as you left it.' },
          { q: 'Do you offer discounts for annual billing?', a: 'Yes! Save approximately 20% when you choose annual billing. The discount is applied automatically at checkout.' },
          { q: 'Is there a contract or commitment?', a: 'No contracts or long-term commitments. All plans are month-to-month unless you choose annual billing. Cancel anytime.' },
        ],
      },
      order: 3,
    },
  });

  await prisma.pageSEO.upsert({
    where: { pageId: pricingPage.id },
    update: {},
    create: {
      pageId: pricingPage.id,
      metaTitle: 'eBay Flow AI Pricing - Plans for Every eBay Seller',
      metaDescription: 'Transparent pricing tailored for eBay sellers worldwide. Start with a 14-day free trial. No credit card required.',
    },
  });

  console.log('✅ Pricing page seeded');

  // ---- FEATURES PAGE ----
  const featuresPage = await prisma.page.upsert({
    where: { slug: 'features' },
    update: {},
    create: { slug: 'features', title: 'Features', template: 'default', sortOrder: 5 },
  });

  // Feature Page Sections
  await prisma.sectionContent.upsert({
    where: { pageId_sectionKey: { pageId: featuresPage.id, sectionKey: 'feature-sections' } },
    update: {},
    create: {
      pageId: featuresPage.id,
      sectionKey: 'feature-sections',
      sectionType: 'custom',
      content: {
        sections: [
          {
            id: 'ai-listings',
            icon: 'Brain',
            title: 'AI-Powered Listing Generation',
            description: 'Create high-converting listings in seconds with our advanced AI that analyzes millions of successful eBay listings.',
            features: [
              { icon: 'FileText', title: 'Smart Title Generation', description: 'AI creates SEO-optimized titles that maximize search visibility. Our algorithm analyzes top-performing listings in your category to craft titles that get noticed.' },
              { icon: 'Layers', title: 'Compelling Descriptions', description: 'Generate professional, persuasive descriptions that highlight key selling points. Automatically formatted with HTML for maximum visual impact.' },
              { icon: 'Tag', title: 'Intelligent Pricing', description: 'Get AI-powered pricing recommendations based on competitor analysis, market trends, and historical sales data to maximize your profits.' },
              { icon: 'Image', title: 'Image Optimization', description: 'AI suggests the best image order and provides enhancement recommendations to make your listings stand out from the competition.' },
            ],
          },
          {
            id: 'inventory',
            icon: 'Package',
            title: 'Smart Inventory Management',
            description: 'Never oversell again with real-time inventory tracking, automated alerts, and seamless multi-account synchronization.',
            features: [
              { icon: 'RefreshCw', title: 'Real-Time Sync', description: 'Inventory levels update instantly across all connected accounts. When you sell an item, stock levels adjust everywhere automatically.' },
              { icon: 'Bell', title: 'Low Stock Alerts', description: 'Get notified before you run out of stock. Set custom thresholds for each product and receive alerts via email or dashboard notifications.' },
              { icon: 'Layers', title: 'Bulk Operations', description: 'Update hundreds of listings at once. Change prices, quantities, or details across your entire inventory with just a few clicks.' },
              { icon: 'Search', title: 'Smart Search & Filter', description: 'Find any product instantly with powerful search and filtering. Filter by SKU, category, stock level, status, and more.' },
            ],
          },
          {
            id: 'analytics',
            icon: 'BarChart3',
            title: 'Advanced Analytics & Insights',
            description: 'Make data-driven decisions with comprehensive analytics that show exactly how your business is performing.',
            features: [
              { icon: 'TrendingUp', title: 'Revenue Analytics', description: 'Track revenue, profit margins, and growth trends over time. See exactly which products and categories drive the most profit.' },
              { icon: 'BarChart3', title: 'Sales by Channel', description: 'Compare performance across different eBay marketplaces. Understand which markets are most profitable for your business.' },
              { icon: 'Download', title: 'Export & Reports', description: 'Generate detailed reports and export data in CSV or PDF format. Share insights with your team or stakeholders.' },
              { icon: 'Brain', title: 'AI Predictions', description: 'Get AI-powered forecasts for sales trends, seasonal demand, and inventory needs. Plan ahead with confidence.' },
            ],
          },
        ],
      },
      order: 1,
    },
  });

  // Feature Comparison Table Section
  await prisma.sectionContent.upsert({
    where: { pageId_sectionKey: { pageId: featuresPage.id, sectionKey: 'comparison' } },
    update: {},
    create: {
      pageId: featuresPage.id,
      sectionKey: 'comparison',
      sectionType: 'custom',
      content: {
        headers: ['Feature', 'Starter', 'Professional', 'Enterprise'],
        rows: [
          ['Active Listings', '500', '5,000', 'Unlimited'],
          ['eBay Accounts', '1', '3', 'Unlimited'],
          ['AI Title Optimizer', 'Basic', 'Advanced', 'Custom Training'],
          ['Inventory Sync', 'Daily', 'Real-time', 'Priority Sync'],
          ['Global Shipping Integrations', 'USPS', 'All Carriers', 'Full API Access'],
          ['Support', 'Email', 'Priority Chat', 'Dedicated Manager'],
          ['API Access', 'None', 'Standard', 'Full Access'],
          ['SLA Guarantee', 'None', '99.9%', '99.99%'],
        ],
      },
      order: 2,
    },
  });

  await prisma.pageSEO.upsert({
    where: { pageId: featuresPage.id },
    update: {},
    create: {
      pageId: featuresPage.id,
      metaTitle: 'eBay Flow AI Features - AI-Powered Listing Management',
      metaDescription: 'AI listing generation, smart inventory management, advanced analytics, and more.',
    },
  });

  console.log('✅ Features page seeded');

  // ---- FAQ PAGE ----
  const faqPage = await prisma.page.upsert({
    where: { slug: 'faq' },
    update: {},
    create: { slug: 'faq', title: 'FAQ', template: 'default', sortOrder: 6 },
  });

  await prisma.pageSEO.upsert({
    where: { pageId: faqPage.id },
    update: {},
    create: {
      pageId: faqPage.id,
      metaTitle: 'eBay Flow AI FAQ - Frequently Asked Questions',
      metaDescription: 'Find answers to common questions about eBay Flow AI billing, features, security, and support.',
    },
  });

  console.log('✅ FAQ page seeded');

  // ---- PRIVACY & TERMS PAGES ----
  for (const slug of ['privacy', 'terms']) {
    await prisma.page.upsert({
      where: { slug },
      update: {},
      create: { slug, title: slug === 'privacy' ? 'Privacy Policy' : 'Terms of Service', template: 'default', sortOrder: 10 },
    });
  }
  console.log('✅ Privacy & Terms pages seeded');

  // ---- TESTIMONIALS ----
  const testimonials = [
    { quote: 'eBay Flow has completely transformed how I manage my eBay business. The AI listing generator alone saves me 10+ hours per week. My sales have increased by 40% since switching.', author: 'James Mitchell', role: 'eBay PowerSeller', company: 'TechDeals Global', rating: 5, stats: '40% sales increase' },
    { quote: 'We manage over 5,000 listings across multiple accounts. eBay Flow\'s bulk operations and inventory sync have eliminated overselling completely.', author: 'Sarah Thompson', role: 'E-commerce Manager', company: 'Fashion Forward Ltd', rating: 5, stats: '5,000+ listings managed' },
    { quote: 'The AI-powered repricing feature has given us a competitive edge we never had before. We\'re winning more buy boxes and our profit margins have improved significantly.', author: 'David Chen', role: 'Founder', company: 'GadgetHub', rating: 5, stats: '25% margin improvement' },
    { quote: 'Before eBay Flow, we were drowning in manual work. Now everything is automated - from listing creation to order processing.', author: 'Emma Williams', role: 'Operations Director', company: 'HomeStyle Direct', rating: 5, stats: '60% time saved' },
    { quote: 'The inventory management is best-in-class. Real-time sync across all our accounts means we never oversell.', author: 'Michael Brown', role: 'Senior Seller', company: 'AutoParts Pro', rating: 5, stats: 'Zero overselling incidents' },
    { quote: 'eBay Flow\'s analytics give us insights we never had before. We can see exactly which products are profitable.', author: 'Lisa Patel', role: 'E-commerce Lead', company: 'Beauty Essentials', rating: 5, stats: 'Data-driven decisions' },
  ];

  for (let i = 0; i < testimonials.length; i++) {
    await prisma.testimonial.upsert({
      where: { id: `testimonial-${i + 1}` },
      update: {},
      create: { id: `testimonial-${i + 1}`, ...testimonials[i], order: i },
    });
  }
  console.log(`✅ ${testimonials.length} testimonials seeded`);

  // ---- FAQ CATEGORIES & ITEMS (ALL 20 from marketing.ts) ----
  const faqCategories = [
    {
      name: 'Getting Started',
      items: [
        { q: 'How do I get started with eBay Flow AI?', a: "Simply create a free account, connect your eBay seller account through our secure OAuth integration, and you're ready to go. The entire setup takes less than 2 minutes. No credit card required for the 14-day free trial." },
        { q: 'Do I need technical knowledge to use eBay Flow?', a: 'Not at all. eBay Flow is designed to be intuitive and user-friendly. If you can use eBay, you can use eBay Flow. Our interface is clean and straightforward, and we provide helpful tooltips and guides throughout the platform.' },
        { q: 'Can I try eBay Flow before committing to a paid plan?', a: "Absolutely! We offer a 14-day free trial on all plans with full access to every feature. No credit card required to start. You can explore the platform, connect your eBay account, and see the value before making any commitment." },
        { q: 'Is eBay Flow available outside the US?', a: 'Yes! eBay Flow supports eBay marketplaces worldwide including the UK, Germany, France, Italy, Spain, Australia, and more. Our platform handles currency conversion and marketplace-specific requirements automatically.' },
      ],
    },
    {
      name: 'Billing & Plans',
      items: [
        { q: 'What payment methods do you accept?', a: 'We accept all major credit and debit cards (Visa, Mastercard, American Express), PayPal, and bank transfers for annual plans. All payments are processed securely through Stripe.' },
        { q: 'Can I change my plan at any time?', a: "Yes, you can upgrade or downgrade your plan at any time. When upgrading, you'll get immediate access to new features and we'll prorate the difference. When downgrading, the change takes effect at the start of your next billing cycle." },
        { q: "What happens when my trial ends?", a: "When your 14-day trial ends, you'll be prompted to choose a plan. If you don't select a plan, your account will be paused but your data will be preserved for 30 days. You can reactivate at any time." },
        { q: 'Do you offer refunds?', a: "We offer a 30-day money-back guarantee on all plans. If you're not satisfied with eBay Flow within the first 30 days of your paid subscription, contact us for a full refund. No questions asked." },
        { q: 'Are there any hidden fees?', a: 'No hidden fees, ever. The price you see is the price you pay. There are no setup fees, no per-listing fees, and no surprise charges. We believe in transparent pricing.' },
      ],
    },
    {
      name: 'Features & AI',
      items: [
        { q: 'How does the AI listing generator work?', a: 'Our AI analyzes millions of successful eBay listings across your category to understand what works. It then generates optimized titles, descriptions, and pricing recommendations based on proven patterns. The more you use it, the better it gets at understanding your specific products.' },
        { q: 'How accurate is the AI-generated content?', a: 'Our AI generates highly accurate and relevant content. However, we always recommend reviewing and personalizing the output before publishing. Most sellers find the AI content is 90-95% ready to use, needing only minor tweaks for their specific products.' },
        { q: 'Can I customize the AI output?', a: "Yes! You can set tone preferences (professional, casual, enthusiastic), specify key features to highlight, add brand guidelines, and even provide example listings for the AI to learn from. The more context you provide, the better the output." },
        { q: 'Does the AI work for all product categories?', a: "Our AI is trained on data from all major eBay categories including electronics, fashion, home & garden, automotive, sports, collectibles, and more. It adapts its recommendations based on the specific category and subcategory of each listing." },
      ],
    },
    {
      name: 'Security & Data',
      items: [
        { q: 'Is my data secure with eBay Flow?', a: "Security is our top priority. We use AES-256 encryption for all data at rest, TLS 1.3 for data in transit, and never store your eBay passwords. We're GDPR compliant, undergo regular security audits, and maintain SOC 2 Type II certification." },
        { q: "Do you store my eBay credentials?", a: "No. We use eBay's official OAuth authentication, which means we never see or store your eBay password. We receive a secure access token that can be revoked at any time from your eBay account settings." },
        { q: 'Where is my data stored?', a: 'All data is stored in secure data centers with global coverage, ensuring compliance with GDPR, CCPA, and international data protection regulations. We use AWS infrastructure with automatic backups and disaster recovery.' },
        { q: 'Can I export or delete my data?', a: 'Yes. Under GDPR, you have the right to access, export, and delete your data at any time. You can export all your data from the Settings page, and you can request complete data deletion which we process within 30 days.' },
      ],
    },
    {
      name: 'Support',
      items: [
        { q: 'How can I get help if I have an issue?', a: 'We offer multiple support channels: email support for all plans (response within 24 hours), live chat for Growth and Professional plans, and a dedicated account manager for Professional plans. We also have an extensive help center and community forum.' },
        { q: 'Do you offer onboarding assistance?', a: 'Yes! All new users get access to our onboarding wizard that walks you through connecting your eBay account and setting up your first listings. Growth and Professional plan users also get a free 30-minute onboarding call with our team.' },
        { q: 'Is there a community I can join?', a: "Yes! We have an active community forum where sellers share tips, strategies, and best practices. Join thousands of fellow sellers to exchange ideas and get advice from experienced e-commerce entrepreneurs." },
      ],
    },
  ];

  for (const cat of faqCategories) {
    const category = await prisma.fAQCategory.upsert({
      where: { id: `faq-cat-${cat.name.toLowerCase().replace(/\s+/g, '-')}` },
      update: {},
      create: { id: `faq-cat-${cat.name.toLowerCase().replace(/\s+/g, '-')}`, name: cat.name, order: faqCategories.indexOf(cat) },
    });

    for (let i = 0; i < cat.items.length; i++) {
      await prisma.fAQItem.upsert({
        where: { id: `faq-${category.id}-${i}` },
        update: {},
        create: { id: `faq-${category.id}-${i}`, categoryId: category.id, question: cat.items[i].q, answer: cat.items[i].a, order: i },
      });
    }
  }
  console.log(`✅ ${faqCategories.length} FAQ categories seeded`);

  // ---- PRICING PLANS ----
  const pricingPlans = [
    { name: 'Starter', price: '$49', period: 'monthly', description: 'Perfect for growing eBay sellers worldwide.', features: ['Up to 500 active listings', 'AI Title Optimizer', 'Daily Inventory Sync', 'Email Support', 'USPS Integration'], order: 1 },
    { name: 'Professional', price: '$149', period: 'monthly', description: 'Our most popular plan for established businesses.', features: ['Up to 5,000 active listings', 'Advanced AI Content Engine', 'Real-time Multi-account Sync', 'Priority Chat Support', 'Global Shipping Integrations', 'Sales Performance Analytics'], isPopular: true, order: 2 },
    { name: 'Enterprise', price: 'Custom', period: 'monthly', description: "Unlimited scale for the world's largest retailers.", features: ['Unlimited active listings', 'Custom AI Model Training', 'Dedicated Account Manager', 'Custom API Access', 'White-label Reports', 'SLA Guarantee'], order: 3 },
    { name: 'Starter', price: '$39', period: 'yearly', description: 'Perfect for growing eBay sellers worldwide.', features: ['Up to 500 active listings', 'AI Title Optimizer', 'Daily Inventory Sync', 'Email Support', 'USPS Integration'], order: 1 },
    { name: 'Professional', price: '$119', period: 'yearly', description: 'Our most popular plan for established businesses.', features: ['Up to 5,000 active listings', 'Advanced AI Content Engine', 'Real-time Multi-account Sync', 'Priority Chat Support', 'Global Shipping Integrations', 'Sales Performance Analytics'], isPopular: true, order: 2 },
    { name: 'Enterprise', price: 'Custom', period: 'yearly', description: "Unlimited scale for the world's largest retailers.", features: ['Unlimited active listings', 'Custom AI Model Training', 'Dedicated Account Manager', 'Custom API Access', 'White-label Reports', 'SLA Guarantee'], order: 3 },
  ];

  for (const plan of pricingPlans) {
    await prisma.pricingPlan.upsert({
      where: { id: `plan-${plan.name.toLowerCase()}-${plan.period}` },
      update: {},
      create: { id: `plan-${plan.name.toLowerCase()}-${plan.period}`, ...plan, features: plan.features as any },
    });
  }
  console.log(`✅ ${pricingPlans.length} pricing plans seeded`);

  // ---- NAVIGATION (ALL from marketing.ts - 5 header + 24 footer = 29 items) ----
  const navItems = [
    // Header (5 items from mainNav)
    { location: 'header', label: 'Features', href: '/features', order: 1 },
    { location: 'header', label: 'Pricing', href: '/pricing', order: 2 },
    { location: 'header', label: 'Integrations', href: '/integrations', order: 3 },
    { location: 'header', label: 'About', href: '/about', order: 4 },
    { location: 'header', label: 'Blog', href: '/blog', order: 5 },
    // Footer - Platform (5 items)
    { location: 'footer', column: 'platform', label: 'Features', href: '/features', order: 1 },
    { location: 'footer', column: 'platform', label: 'Pricing', href: '/pricing', order: 2 },
    { location: 'footer', column: 'platform', label: 'Integrations', href: '/integrations', order: 3 },
    { location: 'footer', column: 'platform', label: 'Changelog', href: '/changelog', order: 4 },
    { location: 'footer', column: 'platform', label: 'Roadmap', href: '/roadmap', order: 5 },
    // Footer - Engine (5 items)
    { location: 'footer', column: 'engine', label: 'Documentation', href: '/docs', order: 1 },
    { location: 'footer', column: 'engine', label: 'API Reference', href: '/docs/api', order: 2 },
    { location: 'footer', column: 'engine', label: 'Blog', href: '/blog', order: 3 },
    { location: 'footer', column: 'engine', label: 'Help Center', href: '/faq', order: 4 },
    { location: 'footer', column: 'engine', label: 'Community', href: '/community', order: 5 },
    // Footer - Company (5 items)
    { location: 'footer', column: 'company', label: 'About', href: '/about', order: 1 },
    { location: 'footer', column: 'company', label: 'Careers', href: '/careers', order: 2 },
    { location: 'footer', column: 'company', label: 'Contact', href: '/contact', order: 3 },
    { location: 'footer', column: 'company', label: 'Press Kit', href: '/press', order: 4 },
    { location: 'footer', column: 'company', label: 'Partners', href: '/partners', order: 5 },
    // Footer - Compliance (5 items)
    { location: 'footer', column: 'compliance', label: 'Privacy Policy', href: '/privacy', order: 1 },
    { location: 'footer', column: 'compliance', label: 'Terms of Service', href: '/terms', order: 2 },
    { location: 'footer', column: 'compliance', label: 'Cookie Policy', href: '/cookies', order: 3 },
    { location: 'footer', column: 'compliance', label: 'GDPR', href: '/gdpr', order: 4 },
    { location: 'footer', column: 'compliance', label: 'Security', href: '/security', order: 5 },
  ];

  for (const item of navItems) {
    await prisma.navigationItem.upsert({
      where: { id: `nav-${item.location}-${item.column || 'main'}-${item.label.toLowerCase().replace(/\s+/g, '-')}` },
      update: {},
      create: { id: `nav-${item.location}-${item.column || 'main'}-${item.label.toLowerCase().replace(/\s+/g, '-')}`, ...item },
    });
  }
  console.log(`✅ ${navItems.length} navigation items seeded`);

  // ---- ADMIN ROLES & PERMISSIONS ----
  const adminRoles = [
    { name: 'Super Admin', description: 'Full access to everything', permissions: ['*'], isSystem: true },
    { name: 'Editor', description: 'Can manage content, blog, media', permissions: ['content:read', 'content:write', 'blog:read', 'blog:write', 'media:read', 'media:write', 'testimonials:read', 'testimonials:write', 'faqs:read', 'faqs:write', 'pricing:read', 'pricing:write'], isSystem: true },
    { name: 'Viewer', description: 'Read-only access', permissions: ['content:read', 'blog:read', 'media:read', 'testimonials:read', 'faqs:read', 'pricing:read', 'seo:read', 'navigation:read', 'settings:read'], isSystem: true },
  ];

  for (const role of adminRoles) {
    await prisma.adminRole.upsert({
      where: { name: role.name },
      update: {},
      create: { ...role, permissions: role.permissions as any },
    });
  }
  console.log(`✅ ${adminRoles.length} admin roles seeded`);

  // Link super admin to Super Admin role
  const superAdminRole = await prisma.adminRole.findUnique({ where: { name: 'Super Admin' } });
  if (superAdminRole) {
    await prisma.adminUser.upsert({
      where: { userId: superAdmin.id },
      update: {},
      create: { userId: superAdmin.id, roleId: superAdminRole.id },
    });
    console.log('✅ Super Admin linked to Super Admin role');
  }

  // ---- THEME DESIGN ----
  await prisma.themeDesign.upsert({
    where: { id: 'default-theme' },
    update: {},
    create: {
      id: 'default-theme',
      name: 'Default Theme',
      isDefault: true,
      colors: {
        primary: '#2563eb',
        primaryHover: '#1d4ed8',
        secondary: '#64748b',
        background: '#ffffff',
        foreground: '#0f172a',
        card: '#ffffff',
        cardForeground: '#0f172a',
        muted: '#f1f5f9',
        mutedForeground: '#64748b',
        border: '#e2e8f0',
        input: '#e2e8f0',
        ring: '#2563eb',
        destructive: '#ef4444',
        destructiveForeground: '#ffffff',
        accent: '#f1f5f9',
        accentForeground: '#0f172a',
        popover: '#ffffff',
        popoverForeground: '#0f172a',
        success: '#22c55e',
        warning: '#f59e0b',
        info: '#3b82f6',
      },
      fontFamily: {
        heading: 'Inter, system-ui, sans-serif',
        body: 'Inter, system-ui, sans-serif',
        mono: 'JetBrains Mono, monospace',
        headingWeight: '700',
        bodyWeight: '400',
      },
      fontSizes: {
        xs: '0.75rem',
        sm: '0.875rem',
        base: '1rem',
        lg: '1.125rem',
        xl: '1.25rem',
        '2xl': '1.5rem',
        '3xl': '1.875rem',
        '4xl': '2.25rem',
        '5xl': '3rem',
        '6xl': '3.75rem',
        '7xl': '4.5rem',
      },
      spacing: {
        xs: '0.25rem',
        sm: '0.5rem',
        md: '1rem',
        lg: '1.5rem',
        xl: '2rem',
        '2xl': '3rem',
        '3xl': '4rem',
        '4xl': '6rem',
        containerMaxWidth: '80rem',
      },
      borderRadius: {
        none: '0px',
        sm: '0.125rem',
        md: '0.375rem',
        lg: '0.5rem',
        xl: '0.75rem',
        '2xl': '1rem',
        '3xl': '1.5rem',
        full: '9999px',
      },
      shadows: {
        sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
        md: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
        lg: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
        xl: '0 20px 25px -5px rgb(0 0 0 / 0.1)',
        inner: 'inset 0 2px 4px 0 rgb(0 0 0 / 0.05)',
        none: 'none',
      },
      animations: {
        duration: '300ms',
        easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
        disableAnimations: false,
      },
      layout: {
        headerHeight: '4rem',
        footerPadding: '3rem',
        sectionPadding: '5rem',
        sidebarWidth: '16rem',
      },
    },
  });
  console.log('✅ Default theme design seeded');

  console.log('\n🎉 All website management data seeded successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
