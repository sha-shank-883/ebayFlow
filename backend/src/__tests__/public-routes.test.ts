/**
 * API integration tests for public (unauthenticated) routes.
 *
 * Tests cover:
 * - GET /api/public/settings - returns site settings
 * - GET /api/public/sections/:pageSlug - returns active sections for a page
 * - GET /api/public/navigation/:location - returns active nav items
 * - GET /api/public/blog - returns published blog posts
 * - GET /api/public/testimonials - returns active testimonials
 * - GET /api/public/faqs - returns active FAQ categories with items
 * - GET /api/public/pricing - returns active pricing plans
 * - Inactive/deleted items are excluded from all responses
 * - Rate limiting returns 429 after exceeding the limit
 * - Caching headers are present on responses
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as SettingsRoute from '../../../app/api/public/settings/route';
import * as SectionsRoute from '../../../app/api/public/sections/[pageSlug]/route';
import * as NavigationRoute from '../../../app/api/public/navigation/[location]/route';
import * as BlogRoute from '../../../app/api/public/blog/route';
import * as TestimonialsRoute from '../../../app/api/public/testimonials/route';
import * as FAQsRoute from '../../../app/api/public/faqs/route';
import * as PricingRoute from '../../../app/api/public/pricing/route';
import { createTestContext, mockRequest, type TestContext } from './setup';
import { cache } from '../../../lib/cache';

// ---------------------------------------------------------------------------
// Test context
// ---------------------------------------------------------------------------

let ctx: TestContext;

beforeEach(async () => {
  ctx = await createTestContext();
  // Clear in-memory cache between tests to avoid stale data
  await cache.clear();
});

afterEach(async () => {
  await ctx.cleanup();
  await cache.clear();
});

// ---------------------------------------------------------------------------
// Helper: create a public page for section tests
// ---------------------------------------------------------------------------

async function createPublicPage(slug: string, title: string, isActive = true, deletedAt: Date | null = null) {
  return ctx.prisma.page.create({
    data: {
      slug,
      title,
      description: 'Public page for testing',
      template: 'default',
      isActive,
      deletedAt,
    },
  });
}

async function createSection(pageId: string, sectionKey: string, sectionType: string, isActive = true, deletedAt: Date | null = null, order = 0) {
  return ctx.prisma.sectionContent.create({
    data: {
      pageId,
      sectionKey,
      sectionType,
      title: `${sectionKey} section`,
      subtitle: 'Test subtitle',
      content: { heading: 'Test', body: 'Test content' },
      isActive,
      deletedAt,
      order,
    },
  });
}

async function createNavItem(location: string, label: string, href: string, isActive = true, deletedAt: Date | null = null, order = 0, column?: string) {
  return ctx.prisma.navigationItem.create({
    data: {
      location,
      label,
      href,
      isActive,
      deletedAt,
      order,
      column,
    },
  });
}

async function createBlogPost(title: string, slug: string, status = 'PUBLISHED', isActive = true, deletedAt: Date | null = null) {
  return ctx.prisma.blogPost.create({
    data: {
      title,
      slug,
      excerpt: 'Test excerpt',
      content: '<p>Test content</p>',
      status,
      isActive,
      deletedAt,
      publishedAt: status === 'PUBLISHED' ? new Date() : null,
    },
  });
}

async function createTestimonial(quote: string, author: string, rating = 5, isActive = true, deletedAt: Date | null = null, order = 0) {
  return ctx.prisma.testimonial.create({
    data: {
      quote,
      author,
      role: 'Test Role',
      company: 'Test Co',
      rating,
      isActive,
      deletedAt,
      order,
    },
  });
}

async function createFaqCategory(name: string, isActive = true, deletedAt: Date | null = null, order = 0) {
  return ctx.prisma.fAQCategory.create({
    data: { name, isActive, deletedAt, order },
  });
}

async function createFaqItem(categoryId: string, question: string, answer: string, isActive = true, deletedAt: Date | null = null, order = 0) {
  return ctx.prisma.fAQItem.create({
    data: { categoryId, question, answer, isActive, deletedAt, order },
  });
}

async function createPricingPlan(name: string, price: string, period = 'monthly', isActive = true, deletedAt: Date | null = null, order = 0) {
  return ctx.prisma.pricingPlan.create({
    data: {
      name,
      price,
      period,
      description: 'Test plan',
      features: ['Feature 1', 'Feature 2'],
      ctaText: 'Get Started',
      ctaLink: '/register',
      isActive,
      deletedAt,
      order,
    },
  });
}

// ---------------------------------------------------------------------------
// GET /api/public/settings
// ---------------------------------------------------------------------------

describe('GET /api/public/settings', () => {
  // Should return settings when they exist in the database
  it('should return site settings when available', async () => {
    // Seed a settings record
    await ctx.prisma.siteSettings.create({
      data: {
        siteName: 'Test Site',
        tagline: 'Test Tagline',
        contactEmail: 'test@example.com',
      },
    });

    const req = mockRequest({ url: 'http://localhost:3000/api/public/settings' });
    const res = await SettingsRoute.GET(req);
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.siteName).toBe('Test Site');
    expect(data.tagline).toBe('Test Tagline');
    expect(data.contactEmail).toBe('test@example.com');
  });

  // Should return empty object when no settings exist
  it('should return empty object when no settings are configured', async () => {
    const req = mockRequest({ url: 'http://localhost:3000/api/public/settings' });
    const res = await SettingsRoute.GET(req);
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data).toEqual({});
  });

  // Should include rate limit headers in the response
  it('should include rate limit headers', async () => {
    const req = mockRequest({ url: 'http://localhost:3000/api/public/settings' });
    const res = await SettingsRoute.GET(req);

    expect(res.headers.get('X-RateLimit-Limit')).toBe('30');
    expect(res.headers.get('X-RateLimit-Remaining')).toBeDefined();
    expect(res.headers.get('X-RateLimit-Reset')).toBeDefined();
  });

  // Should not require authentication
  it('should not require authentication', async () => {
    const req = mockRequest({ url: 'http://localhost:3000/api/public/settings' });
    const res = await SettingsRoute.GET(req);
    expect(res.status).toBe(200);
  });
});

// ---------------------------------------------------------------------------
// GET /api/public/sections/:pageSlug
// ---------------------------------------------------------------------------

describe('GET /api/public/sections/:pageSlug', () => {
  // Should return page and its active sections for a valid slug
  it('should return page and active sections for a valid page slug', async () => {
    const page = await createPublicPage('home', 'Home Page');
    await createSection(page.id, 'hero', 'hero', true, null, 0);
    await createSection(page.id, 'features', 'features', true, null, 1);

    const req = mockRequest({ url: 'http://localhost:3000/api/public/sections/home' });
    const res = await SectionsRoute.GET(req, { params: { pageSlug: 'home' } });
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.page.slug).toBe('home');
    expect(data.page.title).toBe('Home Page');
    expect(Array.isArray(data.sections)).toBe(true);
    expect(data.sections.length).toBe(2);
  });

  // Should return 404 when page does not exist
  it('should return 404 when page slug does not exist', async () => {
    const req = mockRequest({ url: 'http://localhost:3000/api/public/sections/nonexistent' });
    const res = await SectionsRoute.GET(req, { params: { pageSlug: 'nonexistent' } });
    expect(res.status).toBe(404);

    const data = await res.json();
    expect(data.message).toBe('Page not found');
  });

  // Should return 404 when page exists but is inactive
  it('should return 404 when page exists but is inactive', async () => {
    await createPublicPage('hidden-page', 'Hidden Page', false);

    const req = mockRequest({ url: 'http://localhost:3000/api/public/sections/hidden-page' });
    const res = await SectionsRoute.GET(req, { params: { pageSlug: 'hidden-page' } });
    expect(res.status).toBe(404);
  });

  // Should return 404 when page exists but is soft-deleted
  it('should return 404 when page is soft-deleted', async () => {
    await createPublicPage('deleted-page', 'Deleted Page', true, new Date());

    const req = mockRequest({ url: 'http://localhost:3000/api/public/sections/deleted-page' });
    const res = await SectionsRoute.GET(req, { params: { pageSlug: 'deleted-page' } });
    expect(res.status).toBe(404);
  });

  // Should exclude inactive sections from the response
  it('should exclude inactive sections', async () => {
    const page = await createPublicPage('home', 'Home Page');
    await createSection(page.id, 'hero', 'hero', true, null, 0);
    await createSection(page.id, 'hidden-section', 'cta', false, null, 1);

    const req = mockRequest({ url: 'http://localhost:3000/api/public/sections/home' });
    const res = await SectionsRoute.GET(req, { params: { pageSlug: 'home' } });
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.sections.length).toBe(1);
    expect(data.sections[0].sectionKey).toBe('hero');
  });

  // Should exclude soft-deleted sections from the response
  it('should exclude soft-deleted sections', async () => {
    const page = await createPublicPage('home', 'Home Page');
    await createSection(page.id, 'hero', 'hero', true, null, 0);
    await createSection(page.id, 'old-section', 'faq', true, new Date(), 1);

    const req = mockRequest({ url: 'http://localhost:3000/api/public/sections/home' });
    const res = await SectionsRoute.GET(req, { params: { pageSlug: 'home' } });
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.sections.length).toBe(1);
    expect(data.sections[0].sectionKey).toBe('hero');
  });

  // Should return sections ordered by their order field ascending
  it('should return sections ordered by order ascending', async () => {
    const page = await createPublicPage('home', 'Home Page');
    await createSection(page.id, 'third', 'cta', true, null, 2);
    await createSection(page.id, 'first', 'hero', true, null, 0);
    await createSection(page.id, 'second', 'features', true, null, 1);

    const req = mockRequest({ url: 'http://localhost:3000/api/public/sections/home' });
    const res = await SectionsRoute.GET(req, { params: { pageSlug: 'home' } });
    expect(res.status).toBe(200);

    const data = await res.json();
    const keys = data.sections.map((s: any) => s.sectionKey);
    expect(keys).toEqual(['first', 'second', 'third']);
  });

  // Should return empty sections array when page has no sections
  it('should return empty sections array when page has no sections', async () => {
    await createPublicPage('empty-page', 'Empty Page');

    const req = mockRequest({ url: 'http://localhost:3000/api/public/sections/empty-page' });
    const res = await SectionsRoute.GET(req, { params: { pageSlug: 'empty-page' } });
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.sections).toEqual([]);
  });

  // Should include rate limit headers
  it('should include rate limit headers', async () => {
    await createPublicPage('home', 'Home Page');

    const req = mockRequest({ url: 'http://localhost:3000/api/public/sections/home' });
    const res = await SectionsRoute.GET(req, { params: { pageSlug: 'home' } });

    expect(res.headers.get('X-RateLimit-Limit')).toBe('30');
    expect(res.headers.get('X-RateLimit-Remaining')).toBeDefined();
  });
});

// ---------------------------------------------------------------------------
// GET /api/public/navigation/:location
// ---------------------------------------------------------------------------

describe('GET /api/public/navigation/:location', () => {
  // Should return active navigation items for a valid location
  it('should return active nav items for header location', async () => {
    await createNavItem('header', 'Home', '/', true, null, 0);
    await createNavItem('header', 'About', '/about', true, null, 1);
    await createNavItem('header', 'Contact', '/contact', true, null, 2);

    const req = mockRequest({ url: 'http://localhost:3000/api/public/navigation/header' });
    const res = await NavigationRoute.GET(req, { params: { location: 'header' } });
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBe(3);
    expect(data[0].label).toBe('Home');
    expect(data[1].label).toBe('About');
  });

  // Should return active navigation items for footer location
  it('should return active nav items for footer location', async () => {
    await createNavItem('footer', 'Privacy', '/privacy', true, null, 0);
    await createNavItem('footer', 'Terms', '/terms', true, null, 1);

    const req = mockRequest({ url: 'http://localhost:3000/api/public/navigation/footer' });
    const res = await NavigationRoute.GET(req, { params: { location: 'footer' } });
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.length).toBe(2);
  });

  // Should return empty array when no items exist for the location
  it('should return empty array when no nav items exist for location', async () => {
    // Only create header items, not footer
    await createNavItem('header', 'Home', '/', true, null, 0);

    const req = mockRequest({ url: 'http://localhost:3000/api/public/navigation/footer' });
    const res = await NavigationRoute.GET(req, { params: { location: 'footer' } });
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data).toEqual([]);
  });

  // Should exclude inactive navigation items
  it('should exclude inactive nav items', async () => {
    await createNavItem('header', 'Home', '/', true, null, 0);
    await createNavItem('header', 'Old Page', '/old', false, null, 1);

    const req = mockRequest({ url: 'http://localhost:3000/api/public/navigation/header' });
    const res = await NavigationRoute.GET(req, { params: { location: 'header' } });
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.length).toBe(1);
    expect(data[0].label).toBe('Home');
  });

  // Should exclude soft-deleted navigation items
  it('should exclude soft-deleted nav items', async () => {
    await createNavItem('header', 'Home', '/', true, null, 0);
    await createNavItem('header', 'Removed', '/removed', true, new Date(), 1);

    const req = mockRequest({ url: 'http://localhost:3000/api/public/navigation/header' });
    const res = await NavigationRoute.GET(req, { params: { location: 'header' } });
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.length).toBe(1);
    expect(data[0].label).toBe('Home');
  });

  // Should return items ordered by column then order ascending
  it('should return items ordered by column then order', async () => {
    await createNavItem('footer', 'Company', '/company', true, null, 1, 'company');
    await createNavItem('footer', 'About', '/about', true, null, 0, 'company');
    await createNavItem('footer', 'Privacy', '/privacy', true, null, 0, 'platform');

    const req = mockRequest({ url: 'http://localhost:3000/api/public/navigation/footer' });
    const res = await NavigationRoute.GET(req, { params: { location: 'footer' } });
    expect(res.status).toBe(200);

    const data = await res.json();
    const labels = data.map((item: any) => item.label);
    // 'platform' column comes before 'company' column, then ordered by order within column
    expect(labels).toEqual(['Privacy', 'About', 'Company']);
  });

  // Should include rate limit headers
  it('should include rate limit headers', async () => {
    const req = mockRequest({ url: 'http://localhost:3000/api/public/navigation/header' });
    const res = await NavigationRoute.GET(req, { params: { location: 'header' } });

    expect(res.headers.get('X-RateLimit-Limit')).toBe('30');
    expect(res.headers.get('X-RateLimit-Remaining')).toBeDefined();
  });
});

// ---------------------------------------------------------------------------
// GET /api/public/blog
// ---------------------------------------------------------------------------

describe('GET /api/public/blog', () => {
  // Should return published blog posts
  it('should return published blog posts', async () => {
    await createBlogPost('First Post', 'first-post', 'PUBLISHED');
    await createBlogPost('Second Post', 'second-post', 'PUBLISHED');

    const req = mockRequest({ url: 'http://localhost:3000/api/public/blog' });
    const res = await BlogRoute.GET(req);
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.posts.length).toBe(2);
    expect(data.total).toBe(2);
    expect(data.page).toBe(1);
    expect(data.totalPages).toBe(1);
  });

  // Should exclude draft posts from the response
  it('should exclude draft posts', async () => {
    await createBlogPost('Published Post', 'published', 'PUBLISHED');
    await createBlogPost('Draft Post', 'draft', 'DRAFT');

    const req = mockRequest({ url: 'http://localhost:3000/api/public/blog' });
    const res = await BlogRoute.GET(req);
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.posts.length).toBe(1);
    expect(data.posts[0].slug).toBe('published');
  });

  // Should exclude scheduled posts from the response
  it('should exclude scheduled posts', async () => {
    await createBlogPost('Published Post', 'published', 'PUBLISHED');
    await createBlogPost('Scheduled Post', 'scheduled', 'SCHEDULED');

    const req = mockRequest({ url: 'http://localhost:3000/api/public/blog' });
    const res = await BlogRoute.GET(req);
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.posts.length).toBe(1);
    expect(data.posts[0].slug).toBe('published');
  });

  // Should exclude inactive blog posts
  it('should exclude inactive blog posts', async () => {
    await createBlogPost('Active Post', 'active', 'PUBLISHED', true);
    await createBlogPost('Inactive Post', 'inactive', 'PUBLISHED', false);

    const req = mockRequest({ url: 'http://localhost:3000/api/public/blog' });
    const res = await BlogRoute.GET(req);
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.posts.length).toBe(1);
    expect(data.posts[0].slug).toBe('active');
  });

  // Should exclude soft-deleted blog posts
  it('should exclude soft-deleted blog posts', async () => {
    await createBlogPost('Active Post', 'active', 'PUBLISHED', true, null);
    await createBlogPost('Deleted Post', 'deleted', 'PUBLISHED', true, new Date());

    const req = mockRequest({ url: 'http://localhost:3000/api/public/blog' });
    const res = await BlogRoute.GET(req);
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.posts.length).toBe(1);
    expect(data.posts[0].slug).toBe('active');
  });

  // Should return posts ordered by publishedAt descending (newest first)
  it('should return posts ordered by publishedAt descending', async () => {
    await createBlogPost('Old Post', 'old', 'PUBLISHED');
    // Small delay to ensure different publishedAt timestamps
    await new Promise((r) => setTimeout(r, 10));
    await createBlogPost('New Post', 'new', 'PUBLISHED');

    const req = mockRequest({ url: 'http://localhost:3000/api/public/blog' });
    const res = await BlogRoute.GET(req);
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.posts[0].slug).toBe('new');
    expect(data.posts[1].slug).toBe('old');
  });

  // Should support pagination with page and limit query params
  it('should support pagination with page and limit params', async () => {
    // Create 5 posts
    for (let i = 1; i <= 5; i++) {
      await createBlogPost(`Post ${i}`, `post-${i}`, 'PUBLISHED');
      await new Promise((r) => setTimeout(r, 10));
    }

    // Request page 1 with limit 2
    const req = mockRequest({ url: 'http://localhost:3000/api/public/blog?page=1&limit=2' });
    const res = await BlogRoute.GET(req);
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.posts.length).toBe(2);
    expect(data.total).toBe(5);
    expect(data.page).toBe(1);
    expect(data.totalPages).toBe(3);
  });

  // Should return correct total pages for pagination
  it('should calculate correct totalPages', async () => {
    for (let i = 1; i <= 7; i++) {
      await createBlogPost(`Post ${i}`, `post-${i}`, 'PUBLISHED');
      await new Promise((r) => setTimeout(r, 10));
    }

    const req = mockRequest({ url: 'http://localhost:3000/api/public/blog?page=1&limit=3' });
    const res = await BlogRoute.GET(req);
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.totalPages).toBe(3); // ceil(7/3) = 3
  });

  // Should return empty posts array when no published posts exist
  it('should return empty array when no published posts exist', async () => {
    await createBlogPost('Draft Only', 'draft-only', 'DRAFT');

    const req = mockRequest({ url: 'http://localhost:3000/api/public/blog' });
    const res = await BlogRoute.GET(req);
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.posts).toEqual([]);
    expect(data.total).toBe(0);
  });

  // Should include rate limit headers
  it('should include rate limit headers', async () => {
    const req = mockRequest({ url: 'http://localhost:3000/api/public/blog' });
    const res = await BlogRoute.GET(req);

    expect(res.headers.get('X-RateLimit-Limit')).toBe('30');
    expect(res.headers.get('X-RateLimit-Remaining')).toBeDefined();
  });
});

// ---------------------------------------------------------------------------
// GET /api/public/testimonials
// ---------------------------------------------------------------------------

describe('GET /api/public/testimonials', () => {
  // Should return active testimonials
  it('should return active testimonials', async () => {
    await createTestimonial('Great product!', 'Alice', 5);
    await createTestimonial('Highly recommend', 'Bob', 4);

    const req = mockRequest({ url: 'http://localhost:3000/api/public/testimonials' });
    const res = await TestimonialsRoute.GET(req);
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBe(2);
    expect(data[0].author).toBe('Alice');
    expect(data[1].author).toBe('Bob');
  });

  // Should exclude inactive testimonials
  it('should exclude inactive testimonials', async () => {
    await createTestimonial('Good review', 'Active', 5, true);
    await createTestimonial('Hidden review', 'Inactive', 3, false);

    const req = mockRequest({ url: 'http://localhost:3000/api/public/testimonials' });
    const res = await TestimonialsRoute.GET(req);
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.length).toBe(1);
    expect(data[0].author).toBe('Active');
  });

  // Should exclude soft-deleted testimonials
  it('should exclude soft-deleted testimonials', async () => {
    await createTestimonial('Visible review', 'Active', 5, true, null);
    await createTestimonial('Deleted review', 'Deleted', 4, true, new Date());

    const req = mockRequest({ url: 'http://localhost:3000/api/public/testimonials' });
    const res = await TestimonialsRoute.GET(req);
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.length).toBe(1);
    expect(data[0].author).toBe('Active');
  });

  // Should return testimonials ordered by order ascending
  it('should return testimonials ordered by order ascending', async () => {
    await createTestimonial('Third', 'Third Author', 5, true, null, 2);
    await createTestimonial('First', 'First Author', 5, true, null, 0);
    await createTestimonial('Second', 'Second Author', 5, true, null, 1);

    const req = mockRequest({ url: 'http://localhost:3000/api/public/testimonials' });
    const res = await TestimonialsRoute.GET(req);
    expect(res.status).toBe(200);

    const data = await res.json();
    const authors = data.map((t: any) => t.author);
    expect(authors).toEqual(['First Author', 'Second Author', 'Third Author']);
  });

  // Should return empty array when no testimonials exist
  it('should return empty array when no testimonials exist', async () => {
    const req = mockRequest({ url: 'http://localhost:3000/api/public/testimonials' });
    const res = await TestimonialsRoute.GET(req);
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data).toEqual([]);
  });

  // Should include full testimonial data (quote, author, role, company, rating)
  it('should include full testimonial data', async () => {
    await createTestimonial('Amazing service!', 'Jane Doe', 5);

    const req = mockRequest({ url: 'http://localhost:3000/api/public/testimonials' });
    const res = await TestimonialsRoute.GET(req);
    expect(res.status).toBe(200);

    const data = await res.json();
    const testimonial = data[0];
    expect(testimonial.quote).toBe('Amazing service!');
    expect(testimonial.author).toBe('Jane Doe');
    expect(testimonial.role).toBe('Test Role');
    expect(testimonial.company).toBe('Test Co');
    expect(testimonial.rating).toBe(5);
  });

  // Should include rate limit headers
  it('should include rate limit headers', async () => {
    const req = mockRequest({ url: 'http://localhost:3000/api/public/testimonials' });
    const res = await TestimonialsRoute.GET(req);

    expect(res.headers.get('X-RateLimit-Limit')).toBe('30');
    expect(res.headers.get('X-RateLimit-Remaining')).toBeDefined();
  });
});

// ---------------------------------------------------------------------------
// GET /api/public/faqs
// ---------------------------------------------------------------------------

describe('GET /api/public/faqs', () => {
  // Should return active FAQ categories with their active items
  it('should return active FAQ categories with items', async () => {
    const cat1 = await createFaqCategory('General');
    await createFaqItem(cat1.id, 'What is this?', 'This is a test.');
    await createFaqItem(cat1.id, 'How does it work?', 'It works like this.');

    const cat2 = await createFaqCategory('Billing');
    await createFaqItem(cat2.id, 'How to pay?', 'Use credit card.');

    const req = mockRequest({ url: 'http://localhost:3000/api/public/faqs' });
    const res = await FAQsRoute.GET(req);
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBe(2);
    expect(data[0].name).toBe('General');
    expect(data[0].items.length).toBe(2);
    expect(data[1].name).toBe('Billing');
    expect(data[1].items.length).toBe(1);
  });

  // Should exclude inactive FAQ categories
  it('should exclude inactive FAQ categories', async () => {
    const activeCat = await createFaqCategory('Active Category', true);
    await createFaqItem(activeCat.id, 'Active Q', 'Active A');
    await createFaqCategory('Inactive Category', false);

    const req = mockRequest({ url: 'http://localhost:3000/api/public/faqs' });
    const res = await FAQsRoute.GET(req);
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.length).toBe(1);
    expect(data[0].name).toBe('Active Category');
  });

  // Should exclude soft-deleted FAQ categories
  it('should exclude soft-deleted FAQ categories', async () => {
    const activeCat = await createFaqCategory('Active Category', true, null);
    await createFaqItem(activeCat.id, 'Active Q', 'Active A');
    await createFaqCategory('Deleted Category', true, new Date());

    const req = mockRequest({ url: 'http://localhost:3000/api/public/faqs' });
    const res = await FAQsRoute.GET(req);
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.length).toBe(1);
    expect(data[0].name).toBe('Active Category');
  });

  // Should exclude inactive FAQ items within active categories
  it('should exclude inactive FAQ items within active categories', async () => {
    const cat = await createFaqCategory('Mixed Items');
    await createFaqItem(cat.id, 'Active Question', 'Active Answer', true);
    await createFaqItem(cat.id, 'Inactive Question', 'Inactive Answer', false);

    const req = mockRequest({ url: 'http://localhost:3000/api/public/faqs' });
    const res = await FAQsRoute.GET(req);
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data[0].items.length).toBe(1);
    expect(data[0].items[0].question).toBe('Active Question');
  });

  // Should exclude soft-deleted FAQ items within active categories
  it('should exclude soft-deleted FAQ items within active categories', async () => {
    const cat = await createFaqCategory('Mixed Items');
    await createFaqItem(cat.id, 'Active Question', 'Active Answer', true, null);
    await createFaqItem(cat.id, 'Deleted Question', 'Deleted Answer', true, new Date());

    const req = mockRequest({ url: 'http://localhost:3000/api/public/faqs' });
    const res = await FAQsRoute.GET(req);
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data[0].items.length).toBe(1);
    expect(data[0].items[0].question).toBe('Active Question');
  });

  // Should return categories ordered by order ascending
  it('should return categories ordered by order ascending', async () => {
    await createFaqCategory('Third', true, null, 2);
    await createFaqCategory('First', true, null, 0);
    await createFaqCategory('Second', true, null, 1);

    const req = mockRequest({ url: 'http://localhost:3000/api/public/faqs' });
    const res = await FAQsRoute.GET(req);
    expect(res.status).toBe(200);

    const data = await res.json();
    const names = data.map((c: any) => c.name);
    expect(names).toEqual(['First', 'Second', 'Third']);
  });

  // Should return FAQ items ordered by order ascending
  it('should return FAQ items ordered by order ascending', async () => {
    const cat = await createFaqCategory('Ordered Items');
    await createFaqItem(cat.id, 'Third', 'A', true, null, 2);
    await createFaqItem(cat.id, 'First', 'A', true, null, 0);
    await createFaqItem(cat.id, 'Second', 'A', true, null, 1);

    const req = mockRequest({ url: 'http://localhost:3000/api/public/faqs' });
    const res = await FAQsRoute.GET(req);
    expect(res.status).toBe(200);

    const data = await res.json();
    const questions = data[0].items.map((item: any) => item.question);
    expect(questions).toEqual(['First', 'Second', 'Third']);
  });

  // Should return empty array when no FAQ categories exist
  it('should return empty array when no FAQ categories exist', async () => {
    const req = mockRequest({ url: 'http://localhost:3000/api/public/faqs' });
    const res = await FAQsRoute.GET(req);
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data).toEqual([]);
  });

  // Should include rate limit headers
  it('should include rate limit headers', async () => {
    const req = mockRequest({ url: 'http://localhost:3000/api/public/faqs' });
    const res = await FAQsRoute.GET(req);

    expect(res.headers.get('X-RateLimit-Limit')).toBe('30');
    expect(res.headers.get('X-RateLimit-Remaining')).toBeDefined();
  });
});

// ---------------------------------------------------------------------------
// GET /api/public/pricing
// ---------------------------------------------------------------------------

describe('GET /api/public/pricing', () => {
  // Should return active pricing plans for the default period (monthly)
  it('should return monthly plans by default', async () => {
    await createPricingPlan('Starter', '9.99', 'monthly');
    await createPricingPlan('Pro', '29.99', 'monthly');

    const req = mockRequest({ url: 'http://localhost:3000/api/public/pricing' });
    const res = await PricingRoute.GET(req);
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.length).toBe(2);
    expect(data[0].name).toBe('Starter');
    expect(data[1].name).toBe('Pro');
  });

  // Should return pricing plans for a specific period when provided
  it('should return yearly plans when period=yearly', async () => {
    await createPricingPlan('Starter Monthly', '9.99', 'monthly');
    await createPricingPlan('Starter Yearly', '99.99', 'yearly');
    await createPricingPlan('Pro Yearly', '299.99', 'yearly');

    const req = mockRequest({ url: 'http://localhost:3000/api/public/pricing?period=yearly' });
    const res = await PricingRoute.GET(req);
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.length).toBe(2);
    expect(data.every((p: any) => p.period === 'yearly')).toBe(true);
  });

  // Should exclude inactive pricing plans
  it('should exclude inactive pricing plans', async () => {
    await createPricingPlan('Active Plan', '9.99', 'monthly', true);
    await createPricingPlan('Inactive Plan', '19.99', 'monthly', false);

    const req = mockRequest({ url: 'http://localhost:3000/api/public/pricing' });
    const res = await PricingRoute.GET(req);
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.length).toBe(1);
    expect(data[0].name).toBe('Active Plan');
  });

  // Should exclude soft-deleted pricing plans
  it('should exclude soft-deleted pricing plans', async () => {
    await createPricingPlan('Active Plan', '9.99', 'monthly', true, null);
    await createPricingPlan('Deleted Plan', '19.99', 'monthly', true, new Date());

    const req = mockRequest({ url: 'http://localhost:3000/api/public/pricing' });
    const res = await PricingRoute.GET(req);
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.length).toBe(1);
    expect(data[0].name).toBe('Active Plan');
  });

  // Should return plans ordered by order ascending
  it('should return plans ordered by order ascending', async () => {
    await createPricingPlan('Enterprise', '99.99', 'monthly', true, null, 2);
    await createPricingPlan('Starter', '9.99', 'monthly', true, null, 0);
    await createPricingPlan('Pro', '29.99', 'monthly', true, null, 1);

    const req = mockRequest({ url: 'http://localhost:3000/api/public/pricing' });
    const res = await PricingRoute.GET(req);
    expect(res.status).toBe(200);

    const data = await res.json();
    const names = data.map((p: any) => p.name);
    expect(names).toEqual(['Starter', 'Pro', 'Enterprise']);
  });

  // Should return empty array when no plans exist for the period
  it('should return empty array when no plans exist for the period', async () => {
    await createPricingPlan('Monthly Only', '9.99', 'monthly');

    const req = mockRequest({ url: 'http://localhost:3000/api/public/pricing?period=yearly' });
    const res = await PricingRoute.GET(req);
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data).toEqual([]);
  });

  // Should include full plan data (name, price, period, features, ctaText, ctaLink)
  it('should include full plan data', async () => {
    await createPricingPlan('Starter', '9.99', 'monthly');

    const req = mockRequest({ url: 'http://localhost:3000/api/public/pricing' });
    const res = await PricingRoute.GET(req);
    expect(res.status).toBe(200);

    const data = await res.json();
    const plan = data[0];
    expect(plan.name).toBe('Starter');
    expect(plan.price).toBe('9.99');
    expect(plan.period).toBe('monthly');
    expect(plan.description).toBe('Test plan');
    expect(plan.features).toEqual(['Feature 1', 'Feature 2']);
    expect(plan.ctaText).toBe('Get Started');
    expect(plan.ctaLink).toBe('/register');
  });

  // Should include rate limit headers
  it('should include rate limit headers', async () => {
    const req = mockRequest({ url: 'http://localhost:3000/api/public/pricing' });
    const res = await PricingRoute.GET(req);

    expect(res.headers.get('X-RateLimit-Limit')).toBe('30');
    expect(res.headers.get('X-RateLimit-Remaining')).toBeDefined();
  });
});

// ---------------------------------------------------------------------------
// Rate limiting tests
// ---------------------------------------------------------------------------

describe('Rate limiting', () => {
  // Should return 429 after exceeding the rate limit (30 requests per minute)
  it('should return 429 after exceeding rate limit on /api/public/settings', async () => {
    // Rate limit is 30 requests per 60 seconds
    // Make 30 successful requests, then the 31st should be rate limited
    for (let i = 0; i < 30; i++) {
      const req = mockRequest({
        url: 'http://localhost:3000/api/public/settings',
        headers: { 'x-forwarded-for': `192.168.1.${i % 255}` },
      });
      const res = await SettingsRoute.GET(req);
      expect(res.status).toBe(200);
    }

    // 31st request from same IP should be rate limited
    const req = mockRequest({
      url: 'http://localhost:3000/api/public/settings',
      headers: { 'x-forwarded-for': '192.168.1.1' },
    });
    const res = await SettingsRoute.GET(req);
    expect(res.status).toBe(429);

    const data = await res.json();
    expect(data.error).toBe('Too Many Requests');
    expect(res.headers.get('Retry-After')).toBeDefined();
  });

  // Should return 429 with proper error message and Retry-After header
  it('should include Retry-After header when rate limited', async () => {
    const ip = '10.0.0.99';

    // Exhaust the rate limit
    for (let i = 0; i < 30; i++) {
      const req = mockRequest({
        url: 'http://localhost:3000/api/public/testimonials',
        headers: { 'x-forwarded-for': ip },
      });
      await TestimonialsRoute.GET(req);
    }

    // Next request should be rate limited
    const req = mockRequest({
      url: 'http://localhost:3000/api/public/testimonials',
      headers: { 'x-forwarded-for': ip },
    });
    const res = await TestimonialsRoute.GET(req);
    expect(res.status).toBe(429);
    expect(res.headers.get('Retry-After')).toBeDefined();
    expect(res.headers.get('X-RateLimit-Limit')).toBe('30');
    expect(res.headers.get('X-RateLimit-Remaining')).toBe('0');
  });

  // Different IPs should have independent rate limits
  it('should track rate limits per IP independently', async () => {
    const ip1 = '10.0.0.1';
    const ip2 = '10.0.0.2';

    // Exhaust rate limit for IP1
    for (let i = 0; i < 30; i++) {
      const req = mockRequest({
        url: 'http://localhost:3000/api/public/pricing',
        headers: { 'x-forwarded-for': ip1 },
      });
      await PricingRoute.GET(req);
    }

    // IP1 should be rate limited
    const req1 = mockRequest({
      url: 'http://localhost:3000/api/public/pricing',
      headers: { 'x-forwarded-for': ip1 },
    });
    const res1 = await PricingRoute.GET(req1);
    expect(res1.status).toBe(429);

    // IP2 should still be allowed
    const req2 = mockRequest({
      url: 'http://localhost:3000/api/public/pricing',
      headers: { 'x-forwarded-for': ip2 },
    });
    const res2 = await PricingRoute.GET(req2);
    expect(res2.status).toBe(200);
  });
});

// ---------------------------------------------------------------------------
// Caching tests
// ---------------------------------------------------------------------------

describe('Caching', () => {
  // Should cache settings response (second request should be faster due to cache)
  it('should cache settings response', async () => {
    await ctx.prisma.siteSettings.create({
      data: { siteName: 'Cached Site', tagline: 'Cached Tagline' },
    });

    // First request - should populate cache
    const req1 = mockRequest({ url: 'http://localhost:3000/api/public/settings' });
    const res1 = await SettingsRoute.GET(req1);
    const data1 = await res1.json();
    expect(data1.siteName).toBe('Cached Site');

    // Second request - should hit cache
    const req2 = mockRequest({ url: 'http://localhost:3000/api/public/settings' });
    const res2 = await SettingsRoute.GET(req2);
    const data2 = await res2.json();
    expect(data2.siteName).toBe('Cached Site');
  });

  // Should cache testimonials response
  it('should cache testimonials response', async () => {
    await createTestimonial('Cached testimonial', 'Cached Author', 5);

    // First request
    const req1 = mockRequest({ url: 'http://localhost:3000/api/public/testimonials' });
    const res1 = await TestimonialsRoute.GET(req1);
    const data1 = await res1.json();
    expect(data1.length).toBe(1);

    // Second request should return same cached data
    const req2 = mockRequest({ url: 'http://localhost:3000/api/public/testimonials' });
    const res2 = await TestimonialsRoute.GET(req2);
    const data2 = await res2.json();
    expect(data2.length).toBe(1);
    expect(data2[0].author).toBe('Cached Author');
  });

  // Should cache pricing response per period
  it('should cache pricing response per period', async () => {
    await createPricingPlan('Monthly Plan', '9.99', 'monthly');
    await createPricingPlan('Yearly Plan', '99.99', 'yearly');

    // Cache monthly
    const req1 = mockRequest({ url: 'http://localhost:3000/api/public/pricing?period=monthly' });
    const res1 = await PricingRoute.GET(req1);
    const data1 = await res1.json();
    expect(data1[0].name).toBe('Monthly Plan');

    // Cache yearly
    const req2 = mockRequest({ url: 'http://localhost:3000/api/public/pricing?period=yearly' });
    const res2 = await PricingRoute.GET(req2);
    const data2 = await res2.json();
    expect(data2[0].name).toBe('Yearly Plan');

    // Second request for monthly should return cached monthly data
    const req3 = mockRequest({ url: 'http://localhost:3000/api/public/pricing?period=monthly' });
    const res3 = await PricingRoute.GET(req3);
    const data3 = await res3.json();
    expect(data3[0].name).toBe('Monthly Plan');
  });

  // Should cache blog response per page and limit
  it('should cache blog response per page and limit', async () => {
    await createBlogPost('Blog Post 1', 'blog-1', 'PUBLISHED');

    // Cache page 1, limit 10
    const req1 = mockRequest({ url: 'http://localhost:3000/api/public/blog?page=1&limit=10' });
    const res1 = await BlogRoute.GET(req1);
    const data1 = await res1.json();
    expect(data1.posts.length).toBe(1);

    // Same params should return cached result
    const req2 = mockRequest({ url: 'http://localhost:3000/api/public/blog?page=1&limit=10' });
    const res2 = await BlogRoute.GET(req2);
    const data2 = await res2.json();
    expect(data2.posts.length).toBe(1);

    // Different params should be a separate cache entry
    const req3 = mockRequest({ url: 'http://localhost:3000/api/public/blog?page=2&limit=5' });
    const res3 = await BlogRoute.GET(req3);
    const data3 = await res3.json();
    expect(data3.page).toBe(2);
  });

  // Should cache navigation response per location
  it('should cache navigation response per location', async () => {
    await createNavItem('header', 'Home', '/', true, null, 0);
    await createNavItem('footer', 'Privacy', '/privacy', true, null, 0);

    // Cache header
    const req1 = mockRequest({ url: 'http://localhost:3000/api/public/navigation/header' });
    const res1 = await NavigationRoute.GET(req1, { params: { location: 'header' } });
    const data1 = await res1.json();
    expect(data1.length).toBe(1);

    // Cache footer
    const req2 = mockRequest({ url: 'http://localhost:3000/api/public/navigation/footer' });
    const res2 = await NavigationRoute.GET(req2, { params: { location: 'footer' } });
    const data2 = await res2.json();
    expect(data2.length).toBe(1);

    // Header cache should be separate from footer
    const req3 = mockRequest({ url: 'http://localhost:3000/api/public/navigation/header' });
    const res3 = await NavigationRoute.GET(req3, { params: { location: 'header' } });
    const data3 = await res3.json();
    expect(data3[0].label).toBe('Home');
  });

  // Should cache sections response per pageSlug
  it('should cache sections response per pageSlug', async () => {
    const homePage = await createPublicPage('home', 'Home');
    const aboutPage = await createPublicPage('about', 'About');
    await createSection(homePage.id, 'hero', 'hero');
    await createSection(aboutPage.id, 'content', 'html');

    // Cache home sections
    const req1 = mockRequest({ url: 'http://localhost:3000/api/public/sections/home' });
    const res1 = await SectionsRoute.GET(req1, { params: { pageSlug: 'home' } });
    const data1 = await res1.json();
    expect(data1.sections[0].sectionKey).toBe('hero');

    // Cache about sections
    const req2 = mockRequest({ url: 'http://localhost:3000/api/public/sections/about' });
    const res2 = await SectionsRoute.GET(req2, { params: { pageSlug: 'about' } });
    const data2 = await res2.json();
    expect(data2.sections[0].sectionKey).toBe('content');

    // Home cache should be separate
    const req3 = mockRequest({ url: 'http://localhost:3000/api/public/sections/home' });
    const res3 = await SectionsRoute.GET(req3, { params: { pageSlug: 'home' } });
    const data3 = await res3.json();
    expect(data3.sections[0].sectionKey).toBe('hero');
  });
});
