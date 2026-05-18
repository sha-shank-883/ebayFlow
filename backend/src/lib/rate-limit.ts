/**
 * Rate Limiting Middleware for Next.js API Routes
 *
 * Usage:
 *
 * 1. Basic usage with default settings (100 requests per 15 minutes):
 *    export default withRateLimit(async (req, res) => {
 *      res.json({ message: "Hello" });
 *    });
 *
 * 2. Custom configuration:
 *    const limiter = rateLimit({ windowMs: 5 * 60 * 1000, max: 50 });
 *    export default async (req, res) => {
 *      const result = await limiter(req);
 *      if (!result.success) {
 *        return res.status(429).json({ error: "Too many requests" });
 *      }
 *      res.json({ message: "Hello" });
 *    };
 *
 * 3. With custom key function (e.g., rate limit by user ID):
 *    export default withRateLimit(
 *      async (req, res) => { res.json({ message: "Hello" }); },
 *      { keyFn: (req) => req.headers.authorization ?? req.socket.remoteAddress }
 *    );
 */

import type { NextApiRequest, NextApiResponse } from "next";
import { NextResponse } from "next/server";

type RateLimitResult = {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
};

type RateLimitOptions = {
  /** Time window in milliseconds. Default: 15 minutes */
  windowMs?: number;
  /** Maximum requests per window. Default: 100 */
  max?: number;
  /** Custom key extraction function. Defaults to IP-based key */
  keyFn?: (req: NextApiRequest) => string;
  /** Custom error handler for rate-limited requests. Only used with withRateLimit */
  errorHandler?: (req: NextApiRequest, res: NextApiResponse) => void;
};

type Entry = {
  count: number;
  reset: number;
};

// Simple LRU cache implementation with max size to prevent memory leaks
class LRUCache<K, V> {
  private cache = new Map<K, V>();
  private maxSize: number;

  constructor(maxSize = 10000) {
    this.maxSize = maxSize;
  }

  get(key: K): V | undefined {
    if (!this.cache.has(key)) return undefined;
    const value = this.cache.get(key)!;
    // Move to end (most recently used)
    this.cache.delete(key);
    this.cache.set(key, value);
    return value;
  }

  set(key: K, value: V): void {
    if (this.cache.has(key)) {
      this.cache.delete(key);
    } else if (this.cache.size >= this.maxSize) {
      // Evict least recently used (first entry)
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    this.cache.set(key, value);
  }

  has(key: K): boolean {
    return this.cache.has(key);
  }

  delete(key: K): boolean {
    return this.cache.delete(key);
  }
}

// Global store shared across all rate limiters
const store = new LRUCache<string, Entry>();

/**
 * Extract client IP from request headers or socket
 * Checks x-forwarded-for first (for proxied requests),
 * then x-real-ip, then falls back to socket remote address
 */
function getClientIp(req: NextApiRequest): string {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string") {
    // x-forwarded-for can contain multiple IPs; take the first one
    return forwarded.split(",")[0].trim();
  }

  const realIp = req.headers["x-real-ip"];
  if (typeof realIp === "string") {
    return realIp.trim();
  }

  return req.socket?.remoteAddress ?? "unknown";
}

/**
 * Create a rate limiting middleware
 *
 * @param options - Configuration options
 * @returns Async middleware function that returns rate limit result
 */
export function rateLimit(options: RateLimitOptions = {}) {
  const windowMs = options.windowMs ?? 15 * 60 * 1000; // 15 minutes
  const max = options.max ?? 100;
  const keyFn = options.keyFn ?? ((req) => getClientIp(req));

  return async function middleware(req: NextApiRequest): Promise<RateLimitResult> {
    const key = keyFn(req);
    const now = Date.now();

    let entry = store.get(key);

    // Create new entry or reset if window has expired
    if (!entry || now >= entry.reset) {
      entry = {
        count: 0,
        reset: now + windowMs,
      };
    }

    entry.count += 1;
    store.set(key, entry);

    const remaining = Math.max(0, max - entry.count);

    return {
      success: entry.count <= max,
      limit: max,
      remaining,
      reset: entry.reset,
    };
  };
}

/**
 * Wrap an API route handler with rate limiting
 *
 * Automatically returns 429 response when rate limit is exceeded
 *
 * @param handler - The API route handler function
 * @param options - Rate limit configuration options
 * @returns Wrapped API route handler
 */
// App Router overload
export function withRateLimit(
  handler: (req: Request, ctx?: { params: Record<string, string | string[]> }) => Promise<NextResponse>,
  options?: { windowMs?: number; max?: number }
): (req: Request, ctx?: { params: Record<string, string | string[]> }) => Promise<NextResponse>;

// Pages Router overload
export function withRateLimit(
  handler: (req: NextApiRequest, res: NextApiResponse) => void | Promise<void>,
  options?: RateLimitOptions
): (req: NextApiRequest, res: NextApiResponse) => Promise<void>;

// Combined implementation
export function withRateLimit(
  handler: ((req: Request, ctx?: { params: Record<string, string | string[]> }) => Promise<NextResponse>) | ((req: NextApiRequest, res: NextApiResponse) => void | Promise<void>),
  options?: RateLimitOptions | { windowMs?: number; max?: number }
) {
  const limiter = rateLimit(options as RateLimitOptions);

  // App Router handlers receive a Web Request object; Pages Router receives NextApiRequest
  // We detect by checking if the first argument looks like a Web Request (has .headers.get)
  return async function wrappedHandler(req: Request | NextApiRequest, ctx?: { params: Record<string, string | string[]> }): Promise<NextResponse | void> {
    const isAppRouter = typeof (req as Request).headers?.get === "function";

    if (isAppRouter) {
      const webReq = req as Request;
      const ip = webReq.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
        ?? webReq.headers.get("x-real-ip")?.trim()
        ?? "unknown";

      const mockReq = {
        headers: { "x-forwarded-for": ip, "x-real-ip": ip },
        socket: { remoteAddress: ip }
      } as unknown as NextApiRequest;

      const result = await limiter(mockReq);

      const headers = new Headers();
      headers.set("X-RateLimit-Limit", String(result.limit));
      headers.set("X-RateLimit-Remaining", String(result.remaining));
      headers.set("X-RateLimit-Reset", String(result.reset));

      if (!result.success) {
        headers.set("Retry-After", String(Math.ceil((result.reset - Date.now()) / 1000)));
        return NextResponse.json({
          error: "Too Many Requests",
          message: `Rate limit exceeded. Try again in ${Math.ceil((result.reset - Date.now()) / 1000)} seconds.`,
        }, { status: 429, headers });
      }

      return (handler as (req: Request, ctx?: { params: Record<string, string | string[]> }) => Promise<NextResponse>)(webReq, ctx);
    }

    // Pages Router branch
    const pagesReq = req as NextApiRequest;
    const pagesRes = ctx as unknown as NextApiResponse;
    const result = await limiter(pagesReq);

    pagesRes.setHeader("X-RateLimit-Limit", String(result.limit));
    pagesRes.setHeader("X-RateLimit-Remaining", String(result.remaining));
    pagesRes.setHeader("X-RateLimit-Reset", String(result.reset));

    if (!result.success) {
      if ((options as RateLimitOptions)?.errorHandler) {
        return (options as RateLimitOptions).errorHandler!(pagesReq, pagesRes);
      }
      pagesRes.setHeader("Retry-After", String(Math.ceil((result.reset - Date.now()) / 1000)));
      return pagesRes.status(429).json({
        error: "Too Many Requests",
        message: `Rate limit exceeded. Try again in ${Math.ceil((result.reset - Date.now()) / 1000)} seconds.`,
        limit: result.limit,
        remaining: result.remaining,
        reset: result.reset,
      });
    }

    return (handler as (req: NextApiRequest, res: NextApiResponse) => void | Promise<void>)(pagesReq, pagesRes);
  };
}
