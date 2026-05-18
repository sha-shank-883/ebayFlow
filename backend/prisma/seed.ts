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
      tagline: 'AI-Powered eBay Listing Management & Automation for UK Sellers',
      contactEmail: 'hello@ebayflow.ai',
      contactPhone: '+44 20 8123 4567',
      contactAddress: '71-75 Shelton Street, London, WC2H 9JQ, United Kingdom',
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

  // Hero Section
  await prisma.sectionContent.upsert({
    where: { pageId_sectionKey: { pageId: homePage.id, sectionKey: 'hero' } },
    update: {},
    create: {
      pageId: homePage.id,
      sectionKey: 'hero',
      sectionType: 'hero',
      title: 'The Enterprise AI Engine for',
      subtitle: 'UK eBay Sellers',
      content: {
        badge: 'Scale Your eBay Business in the UK',
        description: 'Automate listing creation, optimize for eBay SEO, and sync inventory in real-time. The only listing management tool built specifically for the high-volume UK market.',
        cta: 'Start Your Free Audit',
        ctaLink: '/register',
        secondaryCta: 'View Case Studies',
        secondaryCtaLink: '/case-studies',
        stats: [
          { label: 'UK Sellers', value: '5,000+' },
          { label: 'Listings Optimized', value: '1.2M+' },
          { label: 'Avg. Sales Growth', value: '34%' },
          { label: 'Uptime Guarantee', value: '99.99%' },
        ],
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
      subtitle: 'UK eBay Dominance',
      content: {
        badge: 'Enterprise Capabilities',
        description: "We've built the most advanced toolset specifically for the UK market. Automate the mundane, optimize for the algorithm, and scale without limits.",
        items: [
          { title: 'AI Listing Optimization', description: 'Our AI analyzes thousands of top-performing UK listings to generate titles and descriptions that convert.', icon: 'Sparkles' },
          { title: 'Bulk Inventory Sync', description: 'Real-time synchronization across multiple eBay accounts and warehouses with millisecond latency.', icon: 'RefreshCw' },
          { title: 'eBay SEO Dominance', description: "Proprietary algorithms designed for eBay.co.uk's 'Best Match' search system to keep you at the top.", icon: 'TrendingUp' },
          { title: 'Automated Fulfillment', description: 'Streamline your UK shipping with direct integrations into Royal Mail, Evri, and DPD.', icon: 'Truck' },
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
          { icon: 'Upload', title: 'Connect Your eBay Account', description: 'Securely link your eBay seller account in under 2 minutes. We support multiple accounts and marketplaces including eBay UK, US, DE, and more.', details: ['One-click OAuth connection', 'No passwords stored', 'Bank-level encryption', 'Instant sync of existing listings'] },
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
        description: 'See why thousands of UK eBay sellers choose eBay Flow to power their business.',
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
        description: 'Transparent pricing tailored for UK sellers of all sizes. No hidden fees, no credit card required to start.',
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
      title: 'Scale Your UK Business',
      subtitle: 'at the Speed of AI',
      content: {
        badge: 'Join the eBay Revolution',
        description: 'Experience the enterprise listing engine trusted by the UK\'s top retailers. Start your 14-day masterclass in automation today.',
        primaryCta: 'Get Started Now',
        primaryCtaLink: '/register',
        secondaryCta: 'Talk to Sales',
        secondaryCtaLink: '/contact',
        benefits: ['Instant Setup', 'No Card Required', 'Cancel Anytime'],
      },
      order: 6,
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
        badge: 'Exclusive for UK Sellers',
        description: "Our AI diagnostic tool analyzes your listings against the latest eBay.co.uk 'Best Match' algorithms. Get a comprehensive report on your SEO, pricing, and conversion health.",
        features: [
          { icon: 'BarChart3', title: 'Detailed Sales Gap Analysis', description: 'See exactly where you\'re losing out to competitors in the UK search results.' },
          { icon: 'ShieldCheck', title: 'Listing Health Check', description: 'We scan for missing item specifics and title optimization errors.' },
          { icon: 'Zap', title: 'Instant Scaling Roadmap', description: 'Receive a step-by-step plan to automate your growth with eBay Flow.' },
        ],
        formTitle: 'Get Your Free eBay Audit',
        formDescription: 'Discover hidden optimization opportunities. Our specialists will review your current listing performance.',
      },
      order: 7,
    },
  });

  console.log('✅ Home page sections seeded');

  // ---- HOME PAGE SEO ----
  await prisma.pageSEO.upsert({
    where: { pageId: homePage.id },
    update: {},
    create: {
      pageId: homePage.id,
      metaTitle: 'eBay Flow AI - AI-Powered eBay Listing Management for UK Sellers',
      metaDescription: 'Automate listing creation, optimize for eBay SEO, and sync inventory in real-time. The only listing management tool built for the high-volume UK market.',
      metaKeywords: 'eBay listing tool, eBay SEO, UK eBay, AI listing optimization, inventory management',
      ogTitle: 'eBay Flow AI - Scale Your eBay Business in the UK',
      ogDescription: 'AI-powered listing management, SEO optimization, and inventory sync for UK eBay sellers.',
    },
  });

  // ---- ABOUT PAGE ----
  const aboutPage = await prisma.page.upsert({
    where: { slug: 'about' },
    update: {},
    create: { slug: 'about', title: 'About Us', template: 'default', sortOrder: 2 },
  });

  await prisma.sectionContent.upsert({
    where: { pageId_sectionKey: { pageId: aboutPage.id, sectionKey: 'about-content' } },
    update: {},
    create: {
      pageId: aboutPage.id,
      sectionKey: 'about-content',
      sectionType: 'custom-html',
      content: {
        mission: { title: 'Our Mission', description: 'To democratize enterprise-grade automation for UK eBay sellers. We believe that small businesses should have access to the same AI-powered optimization as global retail giants.' },
        vision: { title: 'Our Vision', description: 'To become the operating system for modern e-commerce. A world where listing, inventory, and fulfillment happen autonomously, letting you focus on strategy and growth.' },
        milestones: [
          { year: '2022', event: 'eBay Flow AI founded in London', detail: 'Started with a mission to help UK sellers leverage AI' },
          { year: '2023', event: 'Series A Funding', detail: 'Raised £5M to expand our platform and team' },
          { year: '2024', event: '10,000+ sellers milestone', detail: 'Became the #1 AI-powered eBay tool in the UK' },
          { year: '2025', event: 'Global expansion', detail: 'Now serving sellers across UK, US, EU, and Australia' },
        ],
        values: [
          { icon: 'Target', title: 'Customer Obsession', description: 'Every feature we build starts with our customers\' needs.' },
          { icon: 'Heart', title: 'Integrity First', description: 'Transparent pricing, honest communication, and ethical data practices.' },
          { icon: 'Users', title: 'Collaborative Spirit', description: 'We work closely with our community of sellers to understand challenges.' },
          { icon: 'Award', title: 'Relentless Innovation', description: 'We push the boundaries of what\'s possible with AI and automation.' },
        ],
      },
      order: 1,
    },
  });

  await prisma.pageSEO.upsert({
    where: { pageId: aboutPage.id },
    update: {},
    create: {
      pageId: aboutPage.id,
      metaTitle: 'About eBay Flow AI - Built by Sellers, for Sellers',
      metaDescription: 'Learn about our mission to empower UK eBay sellers with enterprise-grade AI tools. From London to global.',
    },
  });

  console.log('✅ About page seeded');

  // ---- CONTACT PAGE ----
  const contactPage = await prisma.page.upsert({
    where: { slug: 'contact' },
    update: {},
    create: { slug: 'contact', title: 'Contact Us', template: 'default', sortOrder: 3 },
  });

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
        description: 'Have a question, feedback, or need help? Our UK-based team typically responds within 24 hours.',
        formTitle: 'Send us a message',
        infoTitle: 'Contact Information',
        hours: { title: 'Business Hours', detail: 'Mon-Fri: 9:00 AM - 6:00 PM GMT', weekend: 'Sat-Sun: Closed' },
        immediate: { title: 'Need Immediate Help?', description: 'Check our help center for instant answers to common questions.', linkText: 'Visit Help Center' },
      },
      order: 1,
    },
  });

  await prisma.pageSEO.upsert({
    where: { pageId: contactPage.id },
    update: {},
    create: {
      pageId: contactPage.id,
      metaTitle: 'Contact eBay Flow AI - UK-Based Support',
      metaDescription: 'Get in touch with our UK-based team. We respond within 24 hours.',
    },
  });

  console.log('✅ Contact page seeded');

  // ---- PRICING PAGE ----
  const pricingPage = await prisma.page.upsert({
    where: { slug: 'pricing' },
    update: {},
    create: { slug: 'pricing', title: 'Pricing', template: 'default', sortOrder: 4 },
  });

  await prisma.pageSEO.upsert({
    where: { pageId: pricingPage.id },
    update: {},
    create: {
      pageId: pricingPage.id,
      metaTitle: 'eBay Flow AI Pricing - Plans for Every UK Seller',
      metaDescription: 'Transparent pricing tailored for UK sellers. Start with a 14-day free trial. No credit card required.',
    },
  });

  console.log('✅ Pricing page seeded');

  // ---- FEATURES PAGE ----
  const featuresPage = await prisma.page.upsert({
    where: { slug: 'features' },
    update: {},
    create: { slug: 'features', title: 'Features', template: 'default', sortOrder: 5 },
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
    { quote: 'eBay Flow has completely transformed how I manage my eBay business. The AI listing generator alone saves me 10+ hours per week. My sales have increased by 40% since switching.', author: 'James Mitchell', role: 'eBay PowerSeller', company: 'TechDeals UK', rating: 5, stats: '40% sales increase' },
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

  // ---- FAQ CATEGORIES & ITEMS ----
  const faqCategories = [
    {
      name: 'Getting Started',
      items: [
        { q: 'How do I get started with eBay Flow AI?', a: 'Simply create a free account, connect your eBay seller account through our secure OAuth integration, and you\'re ready to go. The entire setup takes less than 2 minutes.' },
        { q: 'Do I need technical knowledge to use eBay Flow?', a: 'Not at all. eBay Flow is designed to be intuitive and user-friendly. If you can use eBay, you can use eBay Flow.' },
        { q: 'Can I try eBay Flow before committing to a paid plan?', a: 'Absolutely! We offer a 14-day free trial on all plans with full access to every feature. No credit card required.' },
      ],
    },
    {
      name: 'Billing & Plans',
      items: [
        { q: 'What payment methods do you accept?', a: 'We accept all major credit and debit cards (Visa, Mastercard, American Express), PayPal, and bank transfers for annual plans.' },
        { q: 'Can I change my plan at any time?', a: 'Yes, you can upgrade or downgrade your plan at any time. When upgrading, you\'ll get immediate access to new features.' },
        { q: 'Do you offer refunds?', a: 'We offer a 30-day money-back guarantee on all plans.' },
      ],
    },
    {
      name: 'Features & AI',
      items: [
        { q: 'How does the AI listing generator work?', a: 'Our AI analyzes millions of successful eBay listings across your category to understand what works. It then generates optimized titles, descriptions, and pricing recommendations.' },
        { q: 'How accurate is the AI-generated content?', a: 'Our AI generates highly accurate and relevant content. Most sellers find the AI content is 90-95% ready to use.' },
      ],
    },
    {
      name: 'Security & Data',
      items: [
        { q: 'Is my data secure with eBay Flow?', a: 'Security is our top priority. We use AES-256 encryption for all data at rest, TLS 1.3 for data in transit, and never store your eBay passwords.' },
        { q: 'Do you store my eBay credentials?', a: 'No. We use eBay\'s official OAuth authentication, which means we never see or store your eBay password.' },
      ],
    },
    {
      name: 'Support',
      items: [
        { q: 'How can I get help if I have an issue?', a: 'We offer multiple support channels: email support for all plans, live chat for Growth and Professional plans, and a dedicated account manager for Professional plans.' },
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
    { name: 'Starter', price: '£49', period: 'monthly', description: 'Perfect for growing UK eBay sellers.', features: ['Up to 500 active listings', 'AI Title Optimizer', 'Daily Inventory Sync', 'Email Support', 'Royal Mail Integration'], order: 1 },
    { name: 'Professional', price: '£149', period: 'monthly', description: 'Our most popular plan for established businesses.', features: ['Up to 5,000 active listings', 'Advanced AI Content Engine', 'Real-time Multi-account Sync', 'Priority Chat Support', 'All UK Carrier Integrations', 'Sales Performance Analytics'], isPopular: true, order: 2 },
    { name: 'Enterprise', price: 'Custom', period: 'monthly', description: 'Unlimited scale for UK\'s largest retailers.', features: ['Unlimited active listings', 'Custom AI Model Training', 'Dedicated Account Manager', 'Custom API Access', 'White-label Reports', 'SLA Guarantee'], order: 3 },
    { name: 'Starter', price: '£39', period: 'yearly', description: 'Perfect for growing UK eBay sellers.', features: ['Up to 500 active listings', 'AI Title Optimizer', 'Daily Inventory Sync', 'Email Support', 'Royal Mail Integration'], order: 1 },
    { name: 'Professional', price: '£119', period: 'yearly', description: 'Our most popular plan for established businesses.', features: ['Up to 5,000 active listings', 'Advanced AI Content Engine', 'Real-time Multi-account Sync', 'Priority Chat Support', 'All UK Carrier Integrations', 'Sales Performance Analytics'], isPopular: true, order: 2 },
    { name: 'Enterprise', price: 'Custom', period: 'yearly', description: 'Unlimited scale for UK\'s largest retailers.', features: ['Unlimited active listings', 'Custom AI Model Training', 'Dedicated Account Manager', 'Custom API Access', 'White-label Reports', 'SLA Guarantee'], order: 3 },
  ];

  for (const plan of pricingPlans) {
    await prisma.pricingPlan.upsert({
      where: { id: `plan-${plan.name.toLowerCase()}-${plan.period}` },
      update: {},
      create: { id: `plan-${plan.name.toLowerCase()}-${plan.period}`, ...plan, features: plan.features as any },
    });
  }
  console.log(`✅ ${pricingPlans.length} pricing plans seeded`);

  // ---- NAVIGATION ----
  const navItems = [
    // Header
    { location: 'header', label: 'Features', href: '/features', order: 1 },
    { location: 'header', label: 'Pricing', href: '/pricing', order: 2 },
    { location: 'header', label: 'Integrations', href: '/integrations', order: 3 },
    { location: 'header', label: 'About', href: '/about', order: 4 },
    { location: 'header', label: 'Blog', href: '/blog', order: 5 },
    // Footer - Platform
    { location: 'footer', column: 'platform', label: 'Features', href: '/features', order: 1 },
    { location: 'footer', column: 'platform', label: 'Pricing', href: '/pricing', order: 2 },
    { location: 'footer', column: 'platform', label: 'Integrations', href: '/integrations', order: 3 },
    { location: 'footer', column: 'platform', label: 'Changelog', href: '/changelog', order: 4 },
    // Footer - Engine
    { location: 'footer', column: 'engine', label: 'Documentation', href: '/docs', order: 1 },
    { location: 'footer', column: 'engine', label: 'API Reference', href: '/docs/api', order: 2 },
    { location: 'footer', column: 'engine', label: 'Blog', href: '/blog', order: 3 },
    { location: 'footer', column: 'engine', label: 'Help Center', href: '/faq', order: 4 },
    // Footer - Company
    { location: 'footer', column: 'company', label: 'About', href: '/about', order: 1 },
    { location: 'footer', column: 'company', label: 'Careers', href: '/careers', order: 2 },
    { location: 'footer', column: 'company', label: 'Contact', href: '/contact', order: 3 },
    // Footer - Compliance
    { location: 'footer', column: 'compliance', label: 'Privacy Policy', href: '/privacy', order: 1 },
    { location: 'footer', column: 'compliance', label: 'Terms of Service', href: '/terms', order: 2 },
    { location: 'footer', column: 'compliance', label: 'Cookie Policy', href: '/cookies', order: 3 },
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
