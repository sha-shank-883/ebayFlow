import { useAuthStore } from "@/store/useAuthStore";

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null;

  // 1. Check Zustand store directly
  try {
    const storeToken = useAuthStore.getState().token;
    if (storeToken) return storeToken;
  } catch {}

  // 2. Check direct localStorage key 'token'
  try {
    const directToken = localStorage.getItem('token');
    if (directToken) return directToken;
  } catch {}

  // 3. Check Zustand persisted auth-storage
  try {
    const authStorage = localStorage.getItem('auth-storage');
    if (authStorage) {
      const parsed = JSON.parse(authStorage);
      if (parsed?.state?.token) return parsed.state.token;
    }
  } catch {}

  return null;
}

async function adminFetch(path: string, options: RequestInit = {}) {
  const token = getAuthToken();
  
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: 'Request failed' }));
    throw new Error(error.message || `HTTP ${res.status}`);
  }

  const json = await res.json();
  if (json && typeof json === 'object' && 'success' in json && 'data' in json) {
    return json.data;
  }
  return json;
}

export const adminApi = {
  // Stats
  stats: () => adminFetch('/admin/stats'),

  // Settings
  settings: {
    get: () => adminFetch('/admin/settings'),
    update: (data: any) => adminFetch('/admin/settings', { method: 'PUT', body: JSON.stringify(data) }),
  },

  // Pages
  pages: {
    list: (includeInactive = false) => adminFetch(`/admin/pages?includeInactive=${includeInactive}`),
    get: (id: string) => adminFetch(`/admin/pages/${id}`),
    create: (data: any) => adminFetch('/admin/pages', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: any) => adminFetch(`/admin/pages/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: string) => adminFetch(`/admin/pages/${id}`, { method: 'DELETE' }),
    toggleActive: (id: string) => adminFetch(`/admin/pages/${id}/toggle-active`, { method: 'PATCH' }),
  },

  // Sections
  sections: {
    list: (pageId: string, includeInactive = false) => adminFetch(`/admin/pages/${pageId}/sections?includeInactive=${includeInactive}`),
    create: (pageId: string, data: any) => adminFetch(`/admin/pages/${pageId}/sections`, { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: any) => adminFetch(`/admin/sections/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: string) => adminFetch(`/admin/sections/${id}`, { method: 'DELETE' }),
    toggleActive: (id: string) => adminFetch(`/admin/sections/${id}/toggle-active`, { method: 'PATCH' }),
    reorder: (id: string, newOrder: number) => adminFetch(`/admin/sections/${id}/reorder`, { method: 'PATCH', body: JSON.stringify({ newOrder }) }),
  },

  // Media
  media: {
    list: (paramsOrCategory?: string, includeInactive = false) => {
      let url = '/admin/media';
      if (paramsOrCategory) {
        if (paramsOrCategory.startsWith('?') || paramsOrCategory.includes('=')) {
          const sep = paramsOrCategory.startsWith('?') ? '' : '?';
          url = `/admin/media${sep}${paramsOrCategory}&includeInactive=${includeInactive}`;
        } else {
          url = `/admin/media?category=${paramsOrCategory}&includeInactive=${includeInactive}`;
        }
      } else {
        url = `/admin/media?includeInactive=${includeInactive}`;
      }
      return adminFetch(url).then((res: any) => {
        const items = res?.data || (Array.isArray(res?.items) ? res.items : (Array.isArray(res) ? res : []));
        const pagination = res?.pagination || { page: 1, limit: 20, total: items.length, totalPages: Math.ceil(items.length / 20) || 1 };
        return {
          data: items,
          items,
          pagination,
        };
      });
    },
    upload: async (file: File, alt?: string, category?: string) => {
      const token = getAuthToken();
      const formData = new FormData();
      formData.append('file', file);
      if (alt) formData.append('alt', alt);
      if (category) formData.append('category', category);

      const res = await fetch(`${API_URL}/admin/media`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      });

      if (!res.ok) throw new Error('Upload failed');
      const json = await res.json();
      if (json && typeof json === 'object' && 'success' in json && 'data' in json) {
        return json.data;
      }
      return json;
    },
    update: (id: string, data: any) => adminFetch(`/admin/media/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: string) => adminFetch(`/admin/media/${id}`, { method: 'DELETE' }),
    toggleActive: (id: string) => adminFetch(`/admin/media/${id}/toggle-active`, { method: 'PATCH' }),
  },

  // SEO
  seo: {
    list: () => adminFetch('/admin/seo'),
    update: (pageId: string, data: any) => adminFetch(`/admin/seo/${pageId}`, { method: 'PUT', body: JSON.stringify(data) }),
  },

  // Navigation
  navigation: {
    list: (location?: string, includeInactive = false) => {
      const params = new URLSearchParams();
      if (location) params.set('location', location);
      if (includeInactive) params.set('includeInactive', 'true');
      return adminFetch(`/admin/navigation?${params}`);
    },
    create: (data: any) => adminFetch('/admin/navigation', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: any) => adminFetch(`/admin/navigation/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: string) => adminFetch(`/admin/navigation/${id}`, { method: 'DELETE' }),
    toggleActive: (id: string) => adminFetch(`/admin/navigation/${id}/toggle-active`, { method: 'PATCH' }),
  },

  // Blog
  blog: {
    list: (paramsOrStatus?: string, includeInactive = false) => {
      let url = '/admin/blog';
      if (paramsOrStatus) {
        if (paramsOrStatus.startsWith('?') || paramsOrStatus.includes('=')) {
          const sep = paramsOrStatus.startsWith('?') ? '' : '?';
          url = `/admin/blog${sep}${paramsOrStatus}&includeInactive=${includeInactive}`;
        } else {
          url = `/admin/blog?status=${paramsOrStatus}&includeInactive=${includeInactive}`;
        }
      } else {
        url = `/admin/blog?includeInactive=${includeInactive}`;
      }
      return adminFetch(url).then((res: any) => {
        const items = res?.data || (Array.isArray(res?.posts) ? res.posts : (Array.isArray(res?.items) ? res.items : (Array.isArray(res) ? res : [])));
        const pagination = res?.pagination || { page: 1, limit: 20, total: items.length, totalPages: Math.ceil(items.length / 20) || 1 };
        return {
          data: items,
          posts: items,
          items,
          pagination,
        };
      });
    },
    get: (id: string) => adminFetch(`/admin/blog/${id}`),
    create: (data: any) => adminFetch('/admin/blog', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: any) => adminFetch(`/admin/blog/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: string) => adminFetch(`/admin/blog/${id}`, { method: 'DELETE' }),
    toggleActive: (id: string) => adminFetch(`/admin/blog/${id}/toggle-active`, { method: 'PATCH' }),
    restoreVersion: (id: string, versionId: string) => adminFetch(`/admin/blog/${id}/versions/${versionId}/restore`, { method: 'POST' }),
  },

  // Testimonials
  testimonials: {
    list: (queryParams?: string, includeInactive = false) => {
      const base = queryParams || '';
      const sep = base.includes('?') ? '&' : '?';
      return adminFetch(`/admin/testimonials${base}${sep}includeInactive=${includeInactive}`).then((res: any) => {
        const items = res?.data || (Array.isArray(res?.items) ? res.items : (Array.isArray(res?.testimonials) ? res.testimonials : (Array.isArray(res) ? res : [])));
        const pagination = res?.pagination || { page: 1, limit: 20, total: items.length, totalPages: Math.ceil(items.length / 20) || 1 };
        return {
          data: items,
          items,
          testimonials: items,
          pagination,
        };
      });
    },
    create: (data: any) => adminFetch('/admin/testimonials', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: any) => adminFetch(`/admin/testimonials/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: string) => adminFetch(`/admin/testimonials/${id}`, { method: 'DELETE' }),
    toggleActive: (id: string) => adminFetch(`/admin/testimonials/${id}/toggle-active`, { method: 'PATCH' }),
  },

  // FAQs
  faqs: {
    list: (includeInactive = false) => adminFetch(`/admin/faqs?includeInactive=${includeInactive}`),
    create: (action: string, data: any) => adminFetch('/admin/faqs', { method: 'POST', body: JSON.stringify({ action, data }) }),
    updateCategory: (id: string, data: any) => adminFetch(`/admin/faqs/categories/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    deleteCategory: (id: string) => adminFetch(`/admin/faqs/categories/${id}`, { method: 'DELETE' }),
    updateItem: (id: string, data: any) => adminFetch(`/admin/faqs/items/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    deleteItem: (id: string) => adminFetch(`/admin/faqs/items/${id}`, { method: 'DELETE' }),
  },

  // Pricing
  pricing: {
    list: (period?: string, includeInactive = false) => {
      const params = new URLSearchParams();
      if (period) params.set('period', period);
      if (includeInactive) params.set('includeInactive', 'true');
      return adminFetch(`/admin/pricing?${params}`);
    },
    update: (id: string, data: any) => adminFetch(`/admin/pricing/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  },

  // Redirects
  redirects: {
    list: () => adminFetch('/admin/redirects'),
    create: (data: any) => adminFetch('/admin/redirects', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: any) => adminFetch(`/admin/redirects/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: string) => adminFetch(`/admin/redirects/${id}`, { method: 'DELETE' }),
  },

  // Audit
  audit: {
    list: (page = 1, limit = 50, entityType?: string) => {
      const params = new URLSearchParams({ page: String(page), limit: String(limit) });
      if (entityType) params.set('entityType', entityType);
      return adminFetch(`/admin/audit?${params}`);
    },
  },

  // Roles
  roles: {
    list: () => adminFetch('/admin/roles'),
    create: (data: any) => adminFetch('/admin/roles', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: any) => adminFetch(`/admin/roles/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: string) => adminFetch(`/admin/roles/${id}`, { method: 'DELETE' }),
  },

  // Users
  users: {
    list: () => adminFetch('/admin/users'),
    create: (data: any) => adminFetch('/admin/users', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: any) => adminFetch(`/admin/users/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: string) => adminFetch(`/admin/users/${id}`, { method: 'DELETE' }),
  },

  // Theme Design
  theme: {
    list: () => adminFetch('/admin/theme'),
    update: (id: string, data: any) => adminFetch(`/admin/theme`, { method: 'PUT', body: JSON.stringify({ id, ...data }) }),
  },
};
