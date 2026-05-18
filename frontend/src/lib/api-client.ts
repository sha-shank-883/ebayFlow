// frontend/src/lib/api-client.ts
import axios from 'axios';
import { getSession } from 'next-auth/react';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add interceptor to include auth token
api.interceptors.request.use(async (config) => {
  const session = await getSession();
  if ((session?.user as any)?.accessToken) {
    config.headers.Authorization = `Bearer ${(session?.user as any).accessToken}`;
  }
  return config;
});

export default api;
