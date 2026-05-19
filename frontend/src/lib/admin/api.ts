const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

async function adminFetch(path: string, options: RequestInit = {}) {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  
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

  return res.json();
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
    list: (category?: string, includeInactive = false) => {
      const params = new URLSearchParams();
      if (category) params.set('category', category);
      if (includeInactive) params.set('includeInactive', 'true');
      return adminFetch(`/admin/media?${params}`);
    },
    upload: async (file: File, alt?: string, category?: string) => {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
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
      return res.json();
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
    list: (status?: string, includeInactive = false) => {
      const params = new URLSearchParams();
      if (status) params.set('status', status);
      if (includeInactive) params.set('includeInactive', 'true');
      return adminFetch(`/admin/blog?${params}`);
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
      return adminFetch(`/admin/testimonials${base}${sep}includeInactive=${includeInactive}`).then((res: any) => ({
        items: res.data,
        pagination: res.pagination,
      }));
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
};
