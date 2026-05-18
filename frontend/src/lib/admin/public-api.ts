const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

// Cache for public API responses (5 minute TTL)
const cache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000;

async function publicFetch(path: string, cacheKey?: string) {
  const key = cacheKey || path;
  const cached = cache.get(key);
  
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }

  try {
    const res = await fetch(`${API_URL}${path}`, { next: { revalidate: 300 } });
    if (!res.ok) return null;
    const data = await res.json();
    cache.set(key, { data, timestamp: Date.now() });
    return data;
  } catch {
    return null;
  }
}

export function invalidateCache(key?: string) {
  if (key) cache.delete(key);
  else cache.clear();
}

export const publicApi = {
  settings: () => publicFetch('/public/settings', 'settings'),
  sections: (pageSlug: string) => publicFetch(`/public/sections/${pageSlug}`, `sections-${pageSlug}`),
  navigation: (location: string) => publicFetch(`/public/navigation/${location}`, `nav-${location}`),
  blog: (page = 1, limit = 10) => publicFetch(`/public/blog?page=${page}&limit=${limit}`, `blog-${page}`),
  blogPost: (slug: string) => publicFetch(`/public/blog/${slug}`, `blog-${slug}`),
  testimonials: () => publicFetch('/public/testimonials', 'testimonials'),
  faqs: () => publicFetch('/public/faqs', 'faqs'),
  pricing: (period = 'monthly') => publicFetch(`/public/pricing?period=${period}`, `pricing-${period}`),
  seo: (pageSlug: string) => publicFetch(`/public/seo/${pageSlug}`, `seo-${pageSlug}`),
};
