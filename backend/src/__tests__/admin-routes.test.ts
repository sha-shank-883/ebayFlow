/**
 * API integration tests for admin pages routes.
 *
 * Tests cover:
 * - POST /api/admin/pages - create page
 * - GET /api/admin/pages - list pages
 * - PUT /api/admin/pages/:id - update page
 * - DELETE /api/admin/pages/:id - delete page (soft delete)
 * - PATCH /api/admin/pages/:id/toggle-active - toggle active status
 * - Authentication: unauthenticated requests return 401
 * - Authorization: non-SUPER_ADMIN requests return 401
 * - Soft delete: deleted items do not appear in list
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as PagesRoute from '../../../app/api/admin/pages/route';
import * as PageIdRoute from '../../../app/api/admin/pages/[id]/route';
import * as ToggleActiveRoute from '../../../app/api/admin/pages/[id]/toggle-active/route';
import { createTestContext, mockRequest, mockAuth, type TestContext } from './setup';

// ---------------------------------------------------------------------------
// Test context
// ---------------------------------------------------------------------------

let ctx: TestContext;

beforeEach(async () => {
  ctx = await createTestContext();
});

afterEach(async () => {
  await ctx.cleanup();
});

// ---------------------------------------------------------------------------
// Helper: create a non-admin user for authorization tests
// ---------------------------------------------------------------------------

async function createNonAdminUser() {
  const user = await ctx.prisma.user.create({
    data: {
      email: `editor-${Date.now()}@example.com`,
      name: 'Editor User',
      password: '$2a$10$dummyhashfortestingonly00000000000000000',
      role: 'EDITOR',
      isVerified: true,
      isActive: true,
    },
  });
  return user;
}

// ---------------------------------------------------------------------------
// POST /api/admin/pages - Create page
// ---------------------------------------------------------------------------

describe('POST /api/admin/pages', () => {
  // Unauthenticated requests should be rejected with 401
  it('should return 401 when no authentication is provided', async () => {
    const req = mockRequest({
      method: 'POST',
      body: { slug: 'new-page', title: 'New Page' },
    });
    const res = await PagesRoute.POST(req);
    expect(res.status).toBe(401);
  });

  // Non-SUPER_ADMIN users should be rejected (requireSuperAdmin returns null for non-admins)
  it('should return 401 when user is not SUPER_ADMIN', async () => {
    const nonAdmin = await createNonAdminUser();
    const req = mockRequest({
      method: 'POST',
      body: { slug: 'new-page', title: 'New Page' },
      user: mockAuth({ id: nonAdmin.id, role: 'EDITOR' }),
    });
    const res = await PagesRoute.POST(req);
    expect(res.status).toBe(401);
  });

  // Valid page creation with required fields should succeed
  it('should create a page with valid data', async () => {
    const req = mockRequest({
      method: 'POST',
      body: { slug: 'brand-new-page', title: 'Brand New Page' },
      user: mockAuth({ id: ctx.user.id, role: 'SUPER_ADMIN' }),
    });
    const res = await PagesRoute.POST(req);
    expect(res.status).toBe(201);

    const data = await res.json();
    expect(data.slug).toBe('brand-new-page');
    expect(data.title).toBe('Brand New Page');
    expect(data.id).toBeDefined();
  });

  // Page should be created with default template when not specified
  it('should use default template when not provided', async () => {
    const req = mockRequest({
      method: 'POST',
      body: { slug: 'default-template-page', title: 'Default Template Page' },
      user: mockAuth({ id: ctx.user.id, role: 'SUPER_ADMIN' }),
    });
    const res = await PagesRoute.POST(req);
    expect(res.status).toBe(201);

    const data = await res.json();
    expect(data.template).toBe('default');
  });

  // Custom template should be stored when provided
  it('should accept custom template value', async () => {
    const req = mockRequest({
      method: 'POST',
      body: { slug: 'custom-template-page', title: 'Custom Template Page', template: 'landing' },
      user: mockAuth({ id: ctx.user.id, role: 'SUPER_ADMIN' }),
    });
    const res = await PagesRoute.POST(req);
    expect(res.status).toBe(201);

    const data = await res.json();
    expect(data.template).toBe('landing');
  });

  // Description should default to empty string when not provided
  it('should default description to empty string', async () => {
    const req = mockRequest({
      method: 'POST',
      body: { slug: 'no-desc-page', title: 'No Description Page' },
      user: mockAuth({ id: ctx.user.id, role: 'SUPER_ADMIN' }),
    });
    const res = await PagesRoute.POST(req);
    expect(res.status).toBe(201);

    const data = await res.json();
    expect(data.description).toBe('');
  });

  // Duplicate slug should return 409 conflict
  it('should return 409 when slug already exists', async () => {
    // First create a page
    const req1 = mockRequest({
      method: 'POST',
      body: { slug: 'duplicate-slug', title: 'First Page' },
      user: mockAuth({ id: ctx.user.id, role: 'SUPER_ADMIN' }),
    });
    await PagesRoute.POST(req1);

    // Try to create another page with the same slug
    const req2 = mockRequest({
      method: 'POST',
      body: { slug: 'duplicate-slug', title: 'Second Page' },
      user: mockAuth({ id: ctx.user.id, role: 'SUPER_ADMIN' }),
    });
    const res = await PagesRoute.POST(req2);
    expect(res.status).toBe(409);
  });

  // Empty body should result in null fields being stored
  it('should handle empty body by storing null values', async () => {
    const req = mockRequest({
      method: 'POST',
      body: {},
      user: mockAuth({ id: ctx.user.id, role: 'SUPER_ADMIN' }),
    });
    const res = await PagesRoute.POST(req);
    // The route does not validate, so it creates with null slug/title
    expect(res.status).toBe(201);
  });
});

// ---------------------------------------------------------------------------
// GET /api/admin/pages - List pages
// ---------------------------------------------------------------------------

describe('GET /api/admin/pages', () => {
  // Unauthenticated requests should be rejected with 401
  it('should return 401 when no authentication is provided', async () => {
    const req = mockRequest();
    const res = await PagesRoute.GET(req);
    expect(res.status).toBe(401);
  });

  // Non-SUPER_ADMIN users should be rejected
  it('should return 401 when user is not SUPER_ADMIN', async () => {
    const nonAdmin = await createNonAdminUser();
    const req = mockRequest({
      user: mockAuth({ id: nonAdmin.id, role: 'EDITOR' }),
    });
    const res = await PagesRoute.GET(req);
    expect(res.status).toBe(401);
  });

  // Should return only active pages by default (isActive: true, deletedAt: null)
  it('should return only active pages by default', async () => {
    // Create an inactive page
    await ctx.prisma.page.create({
      data: {
        slug: 'inactive-page',
        title: 'Inactive Page',
        isActive: false,
      },
    });

    const req = mockRequest({
      user: mockAuth({ id: ctx.user.id, role: 'SUPER_ADMIN' }),
    });
    const res = await PagesRoute.GET(req);
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(Array.isArray(data)).toBe(true);
    // Should not include the inactive page
    const slugs = data.map((p: any) => p.slug);
    expect(slugs).not.toContain('inactive-page');
  });

  // Should include inactive pages when includeInactive=true
  it('should include inactive pages when includeInactive=true', async () => {
    // Create an inactive page
    await ctx.prisma.page.create({
      data: {
        slug: 'inactive-page',
        title: 'Inactive Page',
        isActive: false,
      },
    });

    const req = mockRequest({
      user: mockAuth({ id: ctx.user.id, role: 'SUPER_ADMIN' }),
      url: 'http://localhost:3000/api/admin/pages?includeInactive=true',
    });
    const res = await PagesRoute.GET(req);
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(Array.isArray(data)).toBe(true);
    const slugs = data.map((p: any) => p.slug);
    expect(slugs).toContain('inactive-page');
  });

  // Deleted pages should not appear in list (soft delete test)
  it('should not include soft-deleted pages in the list', async () => {
    // Soft-delete the seeded page
    await ctx.prisma.page.update({
      where: { id: ctx.page.id },
      data: { deletedAt: new Date() },
    });

    const req = mockRequest({
      user: mockAuth({ id: ctx.user.id, role: 'SUPER_ADMIN' }),
    });
    const res = await PagesRoute.GET(req);
    expect(res.status).toBe(200);

    const data = await res.json();
    const ids = data.map((p: any) => p.id);
    expect(ids).not.toContain(ctx.page.id);
  });

  // Should include SEO and section count in response
  it('should include seo and section count', async () => {
    const req = mockRequest({
      user: mockAuth({ id: ctx.user.id, role: 'SUPER_ADMIN' }),
    });
    const res = await PagesRoute.GET(req);
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.length).toBeGreaterThan(0);
    // The seeded page has seo and sections
    const testPage = data.find((p: any) => p.id === ctx.page.id);
    expect(testPage).toBeDefined();
    expect(testPage._count).toBeDefined();
    expect(testPage._count.sections).toBe(1);
  });

  // Pages should be ordered by sortOrder ascending
  it('should return pages ordered by sortOrder ascending', async () => {
    await ctx.prisma.page.create({
      data: { slug: 'page-a', title: 'Page A', sortOrder: 10 },
    });
    await ctx.prisma.page.create({
      data: { slug: 'page-b', title: 'Page B', sortOrder: 1 },
    });

    const req = mockRequest({
      user: mockAuth({ id: ctx.user.id, role: 'SUPER_ADMIN' }),
    });
    const res = await PagesRoute.GET(req);
    expect(res.status).toBe(200);

    const data = await res.json();
    const slugs = data.map((p: any) => p.slug);
    // page-b (sortOrder 1) should come before page-a (sortOrder 10)
    const idxB = slugs.indexOf('page-b');
    const idxA = slugs.indexOf('page-a');
    expect(idxB).toBeLessThan(idxA);
  });
});

// ---------------------------------------------------------------------------
// PUT /api/admin/pages/:id - Update page
// ---------------------------------------------------------------------------

describe('PUT /api/admin/pages/:id', () => {
  // Unauthenticated requests should be rejected with 401
  it('should return 401 when no authentication is provided', async () => {
    const req = mockRequest({
      method: 'PUT',
      body: { title: 'Updated Title' },
      params: { id: ctx.page.id },
    });
    const res = await PageIdRoute.PUT(req, { params: { id: ctx.page.id } });
    expect(res.status).toBe(401);
  });

  // Non-SUPER_ADMIN users should be rejected
  it('should return 401 when user is not SUPER_ADMIN', async () => {
    const nonAdmin = await createNonAdminUser();
    const req = mockRequest({
      method: 'PUT',
      body: { title: 'Updated Title' },
      user: mockAuth({ id: nonAdmin.id, role: 'EDITOR' }),
    });
    const res = await PageIdRoute.PUT(req, { params: { id: ctx.page.id } });
    expect(res.status).toBe(401);
  });

  // Should return 404 when page does not exist
  it('should return 404 when page does not exist', async () => {
    const req = mockRequest({
      method: 'PUT',
      body: { title: 'Updated Title' },
      user: mockAuth({ id: ctx.user.id, role: 'SUPER_ADMIN' }),
    });
    const res = await PageIdRoute.PUT(req, { params: { id: 'non-existent-id' } });
    expect(res.status).toBe(404);
  });

  // Should update page title successfully
  it('should update page title', async () => {
    const req = mockRequest({
      method: 'PUT',
      body: { title: 'Updated Title' },
      user: mockAuth({ id: ctx.user.id, role: 'SUPER_ADMIN' }),
    });
    const res = await PageIdRoute.PUT(req, { params: { id: ctx.page.id } });
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.title).toBe('Updated Title');
  });

  // Should update page slug successfully
  it('should update page slug', async () => {
    const req = mockRequest({
      method: 'PUT',
      body: { slug: 'updated-slug' },
      user: mockAuth({ id: ctx.user.id, role: 'SUPER_ADMIN' }),
    });
    const res = await PageIdRoute.PUT(req, { params: { id: ctx.page.id } });
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.slug).toBe('updated-slug');
  });

  // Should update multiple fields at once
  it('should update multiple fields at once', async () => {
    const req = mockRequest({
      method: 'PUT',
      body: {
        title: 'New Title',
        slug: 'new-slug',
        description: 'New description',
        template: 'custom',
        sortOrder: 5,
      },
      user: mockAuth({ id: ctx.user.id, role: 'SUPER_ADMIN' }),
    });
    const res = await PageIdRoute.PUT(req, { params: { id: ctx.page.id } });
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.title).toBe('New Title');
    expect(data.slug).toBe('new-slug');
    expect(data.description).toBe('New description');
    expect(data.template).toBe('custom');
    expect(data.sortOrder).toBe(5);
  });

  // Should return 409 when updating to a duplicate slug
  it('should return 409 when updating to a duplicate slug', async () => {
    // Create another page
    await ctx.prisma.page.create({
      data: { slug: 'other-page', title: 'Other Page' },
    });

    // Try to update seeded page to use the same slug
    const req = mockRequest({
      method: 'PUT',
      body: { slug: 'other-page' },
      user: mockAuth({ id: ctx.user.id, role: 'SUPER_ADMIN' }),
    });
    const res = await PageIdRoute.PUT(req, { params: { id: ctx.page.id } });
    expect(res.status).toBe(409);
  });
});

// ---------------------------------------------------------------------------
// DELETE /api/admin/pages/:id - Delete page (soft delete)
// ---------------------------------------------------------------------------

describe('DELETE /api/admin/pages/:id', () => {
  // Unauthenticated requests should be rejected with 401
  it('should return 401 when no authentication is provided', async () => {
    const req = mockRequest({ method: 'DELETE' });
    const res = await PageIdRoute.DELETE(req, { params: { id: ctx.page.id } });
    expect(res.status).toBe(401);
  });

  // Non-SUPER_ADMIN users should be rejected
  it('should return 401 when user is not SUPER_ADMIN', async () => {
    const nonAdmin = await createNonAdminUser();
    const req = mockRequest({
      method: 'DELETE',
      user: mockAuth({ id: nonAdmin.id, role: 'EDITOR' }),
    });
    const res = await PageIdRoute.DELETE(req, { params: { id: ctx.page.id } });
    expect(res.status).toBe(401);
  });

  // Should soft-delete the page (set deletedAt)
  it('should soft-delete the page by setting deletedAt', async () => {
    const req = mockRequest({
      method: 'DELETE',
      user: mockAuth({ id: ctx.user.id, role: 'SUPER_ADMIN' }),
    });
    const res = await PageIdRoute.DELETE(req, { params: { id: ctx.page.id } });
    expect(res.status).toBe(200);

    // Verify deletedAt is set in the database
    const page = await ctx.prisma.page.findUnique({
      where: { id: ctx.page.id },
    });
    expect(page?.deletedAt).not.toBeNull();
  });

  // Soft-deleted pages should not appear in the list
  it('should not include soft-deleted pages in GET list', async () => {
    // Delete the page
    const deleteReq = mockRequest({
      method: 'DELETE',
      user: mockAuth({ id: ctx.user.id, role: 'SUPER_ADMIN' }),
    });
    await PageIdRoute.DELETE(deleteReq, { params: { id: ctx.page.id } });

    // Verify it does not appear in the list
    const listReq = mockRequest({
      user: mockAuth({ id: ctx.user.id, role: 'SUPER_ADMIN' }),
    });
    const listRes = await PagesRoute.GET(listReq);
    const data = await listRes.json();
    const ids = data.map((p: any) => p.id);
    expect(ids).not.toContain(ctx.page.id);
  });

  // Soft-deleted pages should not appear even with includeInactive=true
  it('should not include soft-deleted pages even with includeInactive=true', async () => {
    // Delete the page
    const deleteReq = mockRequest({
      method: 'DELETE',
      user: mockAuth({ id: ctx.user.id, role: 'SUPER_ADMIN' }),
    });
    await PageIdRoute.DELETE(deleteReq, { params: { id: ctx.page.id } });

    // Verify it does not appear even when including inactive
    const listReq = mockRequest({
      user: mockAuth({ id: ctx.user.id, role: 'SUPER_ADMIN' }),
      url: 'http://localhost:3000/api/admin/pages?includeInactive=true',
    });
    const listRes = await PagesRoute.GET(listReq);
    const data = await listRes.json();
    const ids = data.map((p: any) => p.id);
    expect(ids).not.toContain(ctx.page.id);
  });

  // Should return success message
  it('should return success message', async () => {
    const req = mockRequest({
      method: 'DELETE',
      user: mockAuth({ id: ctx.user.id, role: 'SUPER_ADMIN' }),
    });
    const res = await PageIdRoute.DELETE(req, { params: { id: ctx.page.id } });
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.message).toBe('Page deleted');
  });
});

// ---------------------------------------------------------------------------
// PATCH /api/admin/pages/:id/toggle-active - Toggle active status
// ---------------------------------------------------------------------------

describe('PATCH /api/admin/pages/:id/toggle-active', () => {
  // Unauthenticated requests should be rejected with 401
  it('should return 401 when no authentication is provided', async () => {
    const req = mockRequest({ method: 'PATCH' });
    const res = await ToggleActiveRoute.PATCH(req, { params: { id: ctx.page.id } });
    expect(res.status).toBe(401);
  });

  // Non-SUPER_ADMIN users should be rejected
  it('should return 401 when user is not SUPER_ADMIN', async () => {
    const nonAdmin = await createNonAdminUser();
    const req = mockRequest({
      method: 'PATCH',
      user: mockAuth({ id: nonAdmin.id, role: 'EDITOR' }),
    });
    const res = await ToggleActiveRoute.PATCH(req, { params: { id: ctx.page.id } });
    expect(res.status).toBe(401);
  });

  // Should return 404 when page does not exist
  it('should return 404 when page does not exist', async () => {
    const req = mockRequest({
      method: 'PATCH',
      user: mockAuth({ id: ctx.user.id, role: 'SUPER_ADMIN' }),
    });
    const res = await ToggleActiveRoute.PATCH(req, { params: { id: 'non-existent-id' } });
    expect(res.status).toBe(404);
  });

  // Should toggle active page to inactive
  it('should toggle active page to inactive', async () => {
    // Seeded page is active by default
    const req = mockRequest({
      method: 'PATCH',
      user: mockAuth({ id: ctx.user.id, role: 'SUPER_ADMIN' }),
    });
    const res = await ToggleActiveRoute.PATCH(req, { params: { id: ctx.page.id } });
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.isActive).toBe(false);
  });

  // Should toggle inactive page to active
  it('should toggle inactive page to active', async () => {
    // First make the page inactive
    await ctx.prisma.page.update({
      where: { id: ctx.page.id },
      data: { isActive: false },
    });

    const req = mockRequest({
      method: 'PATCH',
      user: mockAuth({ id: ctx.user.id, role: 'SUPER_ADMIN' }),
    });
    const res = await ToggleActiveRoute.PATCH(req, { params: { id: ctx.page.id } });
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.isActive).toBe(true);
  });

  // Multiple toggles should alternate the status correctly
  it('should alternate status on consecutive toggles', async () => {
    const req1 = mockRequest({
      method: 'PATCH',
      user: mockAuth({ id: ctx.user.id, role: 'SUPER_ADMIN' }),
    });
    const res1 = await ToggleActiveRoute.PATCH(req1, { params: { id: ctx.page.id } });
    const data1 = await res1.json();
    expect(data1.isActive).toBe(false);

    const req2 = mockRequest({
      method: 'PATCH',
      user: mockAuth({ id: ctx.user.id, role: 'SUPER_ADMIN' }),
    });
    const res2 = await ToggleActiveRoute.PATCH(req2, { params: { id: ctx.page.id } });
    const data2 = await res2.json();
    expect(data2.isActive).toBe(true);
  });
});
