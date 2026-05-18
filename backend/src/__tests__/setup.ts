/**
 * Test setup utilities for API route testing.
 *
 * Provides helpers for:
 * - In-memory SQLite database via Prisma
 * - Mock Next.js Request objects
 * - Mock authenticated users
 * - Seeding minimal test data
 *
 * Compatible with Vitest and Jest.
 *
 * NOTE: Requires a test-specific Prisma schema with SQLite datasource.
 * Create `prisma/schema.test.prisma` or set DATABASE_URL to `file:./test.db`
 * before running tests. Example schema override:
 *
 *   datasource db {
 *     provider = "sqlite"
 *     url      = "file::memory:?cache=shared"
 *   }
 */

import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface TestContext {
  prisma: PrismaClient;
  user: { id: string; email: string; role: string };
  page: { id: string; slug: string; title: string };
  section: { id: string; pageId: string; sectionKey: string; sectionType: string };
  cleanup: () => Promise<void>;
}

export interface MockRequestOptions {
  method?: string;
  body?: unknown;
  params?: Record<string, string>;
  query?: Record<string, string>;
  user?: { id: string; role: string; email?: string; workspaceId?: string };
  headers?: Record<string, string>;
  url?: string;
}

// ---------------------------------------------------------------------------
// Shared in-memory Prisma client
// ---------------------------------------------------------------------------

let _sharedPrisma: PrismaClient | null = null;

/**
 * Returns a singleton PrismaClient configured for the test environment.
 * Reuses the same instance across calls to avoid connection exhaustion.
 */
function getTestPrisma(): PrismaClient {
  if (!_sharedPrisma) {
    _sharedPrisma = new PrismaClient({
      log: [],
    });
  }
  return _sharedPrisma;
}

// ---------------------------------------------------------------------------
// createTestContext
// ---------------------------------------------------------------------------

/**
 * Sets up a complete test context with a fresh Prisma client, seeded data,
 * and a cleanup function to reset the database state.
 *
 * Call `cleanup()` in an `afterEach` or `afterAll` hook to delete all
 * seeded records and leave the database empty for the next test.
 *
 * @example
 * ```ts
 * let ctx: TestContext;
 *
 * beforeEach(async () => {
 *   ctx = await createTestContext();
 * });
 *
 * afterEach(async () => {
 *   await ctx.cleanup();
 * });
 *
 * test('GET /api/admin/pages returns pages', async () => {
 *   const req = mockRequest({ user: mockAdmin() });
 *   const res = await GET(req);
 *   expect(res.status).toBe(200);
 * });
 * ```
 */
export async function createTestContext(): Promise<TestContext> {
  const prisma = getTestPrisma();

  // Ensure schema is synced for in-memory DB
  await prisma.$executeRawUnsafe('PRAGMA foreign_keys = OFF');
  await prisma.$executeRawUnsafe(`
    DELETE FROM "SectionContent";
    DELETE FROM "PageSEO";
    DELETE FROM "Page";
    DELETE FROM "AdminUser";
    DELETE FROM "AdminRole";
    DELETE FROM "RefreshToken";
    DELETE FROM "AuditLog";
    DELETE FROM "Notification";
    DELETE FROM "User";
  `);
  await prisma.$executeRawUnsafe('PRAGMA foreign_keys = ON');

  const seeded = await seedTestData(prisma);

  const cleanup = async () => {
    await prisma.$executeRawUnsafe('PRAGMA foreign_keys = OFF');
    await prisma.$executeRawUnsafe(`
      DELETE FROM "SectionContent";
      DELETE FROM "PageSEO";
      DELETE FROM "Page";
      DELETE FROM "AdminUser";
      DELETE FROM "AdminRole";
      DELETE FROM "RefreshToken";
      DELETE FROM "AuditLog";
      DELETE FROM "Notification";
      DELETE FROM "User";
    `);
    await prisma.$executeRawUnsafe('PRAGMA foreign_keys = ON');
  };

  return {
    prisma,
    user: {
      id: seeded.user.id,
      email: seeded.user.email,
      role: seeded.user.role,
    },
    page: {
      id: seeded.page.id,
      slug: seeded.page.slug,
      title: seeded.page.title,
    },
    section: {
      id: seeded.section.id,
      pageId: seeded.section.pageId,
      sectionKey: seeded.section.sectionKey,
      sectionType: seeded.section.sectionType,
    },
    cleanup,
  };
}

// ---------------------------------------------------------------------------
// seedTestData
// ---------------------------------------------------------------------------

/**
 * Seeds minimal test data required for most API route tests:
 * - 1 User (SUPER_ADMIN role)
 * - 1 Page (slug: "test-page")
 * - 1 SectionContent (hero section linked to the page)
 *
 * @param prisma - PrismaClient instance to seed data into
 * @returns The created records for reference in tests
 */
export async function seedTestData(prisma: PrismaClient) {
  const user = await prisma.user.create({
    data: {
      email: `test-${shortId()}@example.com`,
      name: 'Test User',
      password: '$2a$10$dummyhashfortestingonly00000000000000000',
      role: 'SUPER_ADMIN',
      isVerified: true,
      isActive: true,
    },
  });

  const page = await prisma.page.create({
    data: {
      slug: `test-page-${shortId()}`,
      title: 'Test Page',
      description: 'A page created for testing',
      template: 'default',
      isActive: true,
    },
  });

  const section = await prisma.sectionContent.create({
    data: {
      pageId: page.id,
      sectionKey: 'hero',
      sectionType: 'hero',
      title: 'Test Hero',
      subtitle: 'Test Subtitle',
      content: {
        heading: 'Welcome',
        body: 'Test content',
      },
      isActive: true,
      order: 0,
    },
  });

  return { user, page, section };
}

// ---------------------------------------------------------------------------
// mockRequest
// ---------------------------------------------------------------------------

/**
 * Creates a mock `Request` object compatible with Next.js App Router
 * API route handlers (`GET`, `POST`, etc.).
 *
 * Supports:
 * - Custom HTTP method
 * - JSON body (serialized and attached via `.json()`)
 * - URL with query string
 * - Authorization header (Bearer token) when `user` is provided
 * - Arbitrary extra headers
 *
 * @param options - Configuration for the mock request
 * @returns A standard Web `Request` instance
 *
 * @example
 * ```ts
 * const req = mockRequest({
 *   method: 'POST',
 *   body: { title: 'New Page', slug: 'new' },
 *   user: { id: 'usr_123', role: 'SUPER_ADMIN' },
 * });
 * ```
 */
export function mockRequest(options: MockRequestOptions = {}): Request {
  const {
    method = 'GET',
    body,
    query = {},
    user,
    headers: extraHeaders = {},
    url: customUrl,
  } = options;

  // Build URL with query string
  const baseUrl = customUrl ?? 'http://localhost:3000/api/test';
  const url = new URL(baseUrl);
  for (const [key, value] of Object.entries(query)) {
    url.searchParams.set(key, value);
  }

  // Build headers
  const headers = new Headers(extraHeaders);
  headers.set('Content-Type', 'application/json');

  if (user) {
    const token = generateMockJwt(user);
    headers.set('Authorization', `Bearer ${token}`);
  }

  // Build init object
  const init: RequestInit = {
    method,
    headers,
  };

  if (body !== undefined && method !== 'GET' && method !== 'HEAD') {
    init.body = JSON.stringify(body);
  }

  return new Request(url.toString(), init);
}

// ---------------------------------------------------------------------------
// mockAuth
// ---------------------------------------------------------------------------

/**
 * Creates a mock authenticated user payload that matches the shape
 * returned by `getAuthenticatedUser()` in `src/app/api/_auth.ts`.
 *
 * The returned object can be passed directly to `mockRequest({ user })`
 * to simulate an authenticated request.
 *
 * @param user - Partial user info (id and role required)
 * @returns A mock JWT-decoded user payload
 *
 * @example
 * ```ts
 * const admin = mockAuth({ id: 'usr_abc', role: 'SUPER_ADMIN' });
 * const req = mockRequest({ user: admin });
 * ```
 */
export function mockAuth(user: { id: string; role: string }) {
  return {
    userId: user.id,
    role: user.role,
    email: user.id.includes('admin') ? 'admin@example.com' : `user-${user.id}@example.com`,
    workspaceId: undefined as string | undefined,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 3600,
  };
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/**
 * Generates a short unique identifier for test data naming.
 */
function shortId(): string {
  return crypto.randomBytes(4).toString('hex');
}

/**
 * Generates a mock JWT token that can be decoded by `jsonwebtoken.verify()`
 * without a real secret. Uses a fixed test secret matching the default
 * test environment value.
 *
 * In tests, set `process.env.JWT_SECRET = 'test-secret'` before importing
 * the auth module so verification succeeds.
 */
function generateMockJwt(user: { id: string; role: string; email?: string; workspaceId?: string }): string {
  // Simple base64-encoded mock token that decodes to the user payload.
  // Real tests should set JWT_SECRET and use jsonwebtoken.sign() instead.
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const payload = Buffer.from(
    JSON.stringify({
      userId: user.id,
      role: user.role,
      email: user.email ?? `user-${user.id}@example.com`,
      workspaceId: user.workspaceId,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 3600,
    })
  ).toString('base64url');
  const signature = Buffer.from('mock-signature').toString('base64url');
  return `${header}.${payload}.${signature}`;
}
