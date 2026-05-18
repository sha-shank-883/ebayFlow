"use client";

import { useEffect, useRef } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { fetchApi } from '../lib/api';
import { useRouter } from 'next/navigation';

export function useAuth() {
  const { user, token, isAuthenticated, isLoading, isInitialized, setUser, logout, setLoading, refreshToken, setInitialized } = useAuthStore();
  const router = useRouter();
  const initRef = useRef(false);

  useEffect(() => {
    if (isInitialized || initRef.current) return;

    initRef.current = true;

    const initAuth = async () => {
      if (token && !isAuthenticated) {
        try {
          const userProfile = await fetchApi<any>('/auth/me', {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });
          
          setUser(userProfile, token);
        } catch (error: any) {
          if (error.status === 401) {
            const refreshed = await refreshToken();
            if (!refreshed) {
              logout();
            }
          } else {
            logout();
          }
        }
      } else {
        setInitialized();
      }
    };

    initAuth();
  }, []);

  return { user, token, isAuthenticated, isLoading, isInitialized, logout };
}
