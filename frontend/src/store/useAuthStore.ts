import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface User {
  id: string;
  email: string;
  name: string;
  firstName?: string;
  lastName?: string;
  role: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isInitialized: boolean;
  setUser: (user: User | null, token?: string) => void;
  logout: () => Promise<void>;
  setLoading: (loading: boolean) => void;
  refreshToken: () => Promise<boolean>;
  setInitialized: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      isInitialized: false,
      setUser: (user, token) => {
        const currentToken = token || get().token;
        set({ 
          user, 
          token: currentToken, 
          isAuthenticated: !!user, 
          isLoading: false,
          isInitialized: true,
        });
      },
      logout: async () => {
        const token = get().token;
        try {
          await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api'}/auth/logout`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
          });
        } catch (error) {
          console.error('Logout error:', error);
        } finally {
          set({ user: null, token: null, isAuthenticated: false, isLoading: false, isInitialized: true });
        }
      },
      setLoading: (isLoading) => {
        set({ isLoading });
      },
      setInitialized: () => {
        set({ isInitialized: true, isLoading: false });
      },
      refreshToken: async () => {
        try {
          const storedToken = get().token;
          const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api'}/auth/refresh`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refreshToken: storedToken }),
            credentials: 'include',
          });

          if (!response.ok) {
            throw new Error('Token refresh failed');
          }

          const data = await response.json();
          set({
            token: data.accessToken,
            user: data.user,
            isAuthenticated: true,
            isLoading: false,
            isInitialized: true,
          });
          return true;
        } catch (error) {
          console.error('Token refresh error:', error);
          set({ user: null, token: null, isAuthenticated: false, isLoading: false, isInitialized: true });
          return false;
        }
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ 
        user: state.user, 
        token: state.token, 
        isAuthenticated: state.isAuthenticated,
        isInitialized: state.isInitialized,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.isLoading = false;
          state.isInitialized = true;
        }
      }
    }
  )
);
