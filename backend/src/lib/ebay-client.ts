import axios, { AxiosInstance, AxiosRequestConfig, AxiosError } from 'axios';

const EBAY_API_BASE = 'https://api.ebay.com';
const EBAY_SANDBOX_API_BASE = 'https://api.sandbox.ebay.com';

export class EbayApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string,
    public details?: any,
  ) {
    super(message);
    this.name = 'EbayApiError';
  }
}

export class EbayClient {
  private client: AxiosInstance;
  private isSandbox: boolean;
  private accessToken: string;

  constructor(accessToken: string, isSandbox = false) {
    this.accessToken = accessToken;
    this.isSandbox = isSandbox;
    const base = isSandbox ? EBAY_SANDBOX_API_BASE : EBAY_API_BASE;
    this.client = axios.create({
      baseURL: base,
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'X-EBAY-C-MARKETPLACE-ID': 'EBAY_GB',
      },
    });

    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        if (error.response) {
          const status = error.response.status;
          const data = error.response.data as any;

          if (status === 401) {
            throw new EbayApiError('eBay access token expired or invalid', 401, 'TOKEN_EXPIRED');
          }

          if (status === 429) {
            const retryAfter = error.response.headers['retry-after']
              ? parseInt(error.response.headers['retry-after']) * 1000
              : 5000;
            throw new EbayApiError(`Rate limited by eBay. Retry after ${retryAfter / 1000}s`, 429, 'RATE_LIMITED', { retryAfter });
          }

          const errorMessage = data?.errors?.[0]?.message || data?.message || `eBay API error: ${status}`;
          const errorCode = data?.errors?.[0]?.errorId || data?.error;
          throw new EbayApiError(errorMessage, status, errorCode, data);
        }

        if (error.request) {
          throw new EbayApiError('No response from eBay API', 0, 'NETWORK_ERROR');
        }

        throw new EbayApiError(error.message || 'Unknown error', 0, 'UNKNOWN', error);
      },
    );
  }

  private async withRetry<T>(fn: () => Promise<T>, maxRetries = 2): Promise<T> {
    let lastError: Error | undefined;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error: any) {
        lastError = error;

        if (error instanceof EbayApiError && error.code === 'RATE_LIMITED') {
          const delay = error.details?.retryAfter || (Math.pow(2, attempt) * 1000);
          await new Promise((resolve) => setTimeout(resolve, delay));
          continue;
        }

        if (error instanceof EbayApiError && error.status >= 500 && attempt < maxRetries) {
          await new Promise((resolve) => setTimeout(resolve, Math.pow(2, attempt) * 1000));
          continue;
        }

        throw error;
      }
    }

    throw lastError;
  }

  async get<T>(path: string, config?: AxiosRequestConfig): Promise<T> {
    return this.withRetry(async () => {
      const response = await this.client.get<T>(path, config);
      return response.data;
    });
  }

  async post<T>(path: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    return this.withRetry(async () => {
      const response = await this.client.post<T>(path, data, config);
      return response.data;
    });
  }

  async put<T>(path: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    return this.withRetry(async () => {
      const response = await this.client.put<T>(path, data, config);
      return response.data;
    });
  }

  async patch<T>(path: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    return this.withRetry(async () => {
      const response = await this.client.patch<T>(path, data, config);
      return response.data;
    });
  }

  async delete<T>(path: string, config?: AxiosRequestConfig): Promise<T> {
    return this.withRetry(async () => {
      const response = await this.client.delete<T>(path, config);
      return response.data;
    });
  }

  getBaseUrl(): string {
    return this.isSandbox ? EBAY_SANDBOX_API_BASE : EBAY_API_BASE;
  }
}
