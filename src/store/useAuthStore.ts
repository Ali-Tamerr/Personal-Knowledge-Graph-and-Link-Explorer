import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Profile } from '@/types/knowledge';

interface AuthState {
  user: Profile | null;
  isAuthenticated: boolean;
  isAuthLoading: boolean;
  authError: string | null;
  
  setUser: (user: Profile | null) => void;
  setAuthLoading: (loading: boolean) => void;
  setAuthError: (error: string | null) => void;
  login: (user: Profile) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      isAuthLoading: false,
      authError: null,

      setUser: (user) => set({ user, isAuthenticated: !!user }),
      setAuthLoading: (loading) => set({ isAuthLoading: loading }),
      setAuthError: (error) => set({ authError: error }),
      
      login: (user) => set({ 
        user, 
        isAuthenticated: true, 
        authError: null 
      }),
      
      logout: () => set({ 
        user: null, 
        isAuthenticated: false,
        authError: null 
      }),
    }),
    {
      name: 'nexus-auth',
      partialize: (state) => ({ 
        user: state.user, 
        isAuthenticated: state.isAuthenticated 
      }),
    }
  )
);
