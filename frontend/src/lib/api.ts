import { useAuthStore } from "@/store/useAuthStore";

export const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = "ApiError";
  }
}

export async function fetchApi<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = useAuthStore.getState().token;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string> || {}),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const url = `${API_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errorMessage = "An error occurred";
    let fieldErrors: Record<string, string[]> | undefined;
    try {
      const errorData = await response.json();
      errorMessage = errorData.message || errorMessage;
      fieldErrors = errorData.errors;
      console.error(`[fetchApi] Error response for ${endpoint}:`, errorData);
    } catch (e) {
      console.error(`[fetchApi] Failed to parse error response for ${endpoint}`);
    }
    const error = new ApiError(response.status, errorMessage);
    if (fieldErrors) {
      (error as any).fieldErrors = fieldErrors;
    }
    throw error;
  }

  // Handle empty responses
  const text = await response.text();
  if (!text) return {} as T;

  try {
    const result = JSON.parse(text);
    // Unwrap the NestJS TransformInterceptor wrapper if it exists
    if (result && typeof result === 'object' && 'success' in result && 'data' in result) {
      console.log(`[fetchApi] Unwrapping response for ${endpoint}`);
      return result.data as T;
    }
    return result as T;
  } catch (error) {
    console.error(`[fetchApi] Failed to parse JSON for ${endpoint}:`, text);
    return {} as T;
  }
}

export const ebayTradingApi = {
  getActiveListings(params?: { entriesPerPage?: number; page?: number; sort?: string }) {
    const qs = new URLSearchParams();
    if (params?.entriesPerPage) qs.set('entriesPerPage', String(params.entriesPerPage));
    if (params?.page) qs.set('page', String(params.page));
    if (params?.sort) qs.set('sort', params.sort);
    return fetchApi(`/ebay/trading?action=active-listings&${qs.toString()}`);
  },

  getSoldListings(params?: { entriesPerPage?: number; page?: number; durationInDays?: number }) {
    const qs = new URLSearchParams();
    if (params?.entriesPerPage) qs.set('entriesPerPage', String(params.entriesPerPage));
    if (params?.page) qs.set('page', String(params.page));
    if (params?.durationInDays) qs.set('durationInDays', String(params.durationInDays));
    return fetchApi(`/ebay/trading?action=sold-listings&${qs.toString()}`);
  },

  getUnsoldListings(params?: { entriesPerPage?: number; page?: number; durationInDays?: number }) {
    const qs = new URLSearchParams();
    if (params?.entriesPerPage) qs.set('entriesPerPage', String(params.entriesPerPage));
    if (params?.page) qs.set('page', String(params.page));
    if (params?.durationInDays) qs.set('durationInDays', String(params.durationInDays));
    return fetchApi(`/ebay/trading?action=unsold-listings&${qs.toString()}`);
  },

  getScheduledListings(params?: { entriesPerPage?: number; page?: number }) {
    const qs = new URLSearchParams();
    if (params?.entriesPerPage) qs.set('entriesPerPage', String(params.entriesPerPage));
    if (params?.page) qs.set('page', String(params.page));
    return fetchApi(`/ebay/trading?action=scheduled-listings&${qs.toString()}`);
  },

  getSellingSummary() {
    return fetchApi(`/ebay/trading?action=selling-summary`);
  },

  getOrders(params?: { entriesPerPage?: number; page?: number; numberOfDays?: number; statusFilter?: string }) {
    const qs = new URLSearchParams();
    if (params?.entriesPerPage) qs.set('entriesPerPage', String(params.entriesPerPage));
    if (params?.page) qs.set('page', String(params.page));
    if (params?.numberOfDays) qs.set('numberOfDays', String(params.numberOfDays));
    if (params?.statusFilter) qs.set('statusFilter', params.statusFilter);
    return fetchApi(`/ebay/trading?action=orders&${qs.toString()}`);
  },

  getSellerListings(params?: { entriesPerPage?: number; page?: number }) {
    const qs = new URLSearchParams();
    if (params?.entriesPerPage) qs.set('entriesPerPage', String(params.entriesPerPage));
    if (params?.page) qs.set('page', String(params.page));
    return fetchApi(`/ebay/trading?action=seller-listings&${qs.toString()}`);
  },

  getItem(itemId: string) {
    return fetchApi(`/ebay/trading/item/${itemId}`);
  },

  getCategories(params?: { categoryId?: string; levelLimit?: number }) {
    const qs = new URLSearchParams();
    if (params?.categoryId) qs.set('categoryId', params.categoryId);
    if (params?.levelLimit) qs.set('levelLimit', String(params.levelLimit));
    return fetchApi(`/ebay/trading?action=categories&${qs.toString()}`);
  },

  addItem(data: any) {
    return fetchApi(`/ebay/trading?action=add-item`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  addFixedPriceItem(data: any) {
    return fetchApi(`/ebay/trading?action=add-fixed-price`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  reviseItem(itemId: string, data: any) {
    return fetchApi(`/ebay/trading/item/${itemId}?action=revise`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  endItem(itemId: string, reason?: string) {
    return fetchApi(`/ebay/trading?action=end-item`, {
      method: 'POST',
      body: JSON.stringify({ itemId, reason }),
    });
  },

  endItems(itemIds: string[], reason?: string) {
    return fetchApi(`/ebay/trading?action=end-items`, {
      method: 'POST',
      body: JSON.stringify({ itemIds, reason }),
    });
  },

  relistItem(itemId: string) {
    return fetchApi(`/ebay/trading?action=relist-item`, {
      method: 'POST',
      body: JSON.stringify({ itemId }),
    });
  },

  completeSale(orderId: string, shipped?: boolean, paid?: boolean) {
    return fetchApi(`/ebay/trading/orders/${orderId}?action=complete-sale`, {
      method: 'POST',
      body: JSON.stringify({ shipped, paid }),
    });
  },

  syncAll() {
    return fetchApi(`/ebay/trading?action=sync-all`, {
      method: 'POST',
      body: JSON.stringify({}),
    });
  },
};

