import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import type { User, Session } from '@supabase/supabase-js';
import type { StorageMode } from '@/lib/storage-mode';

/**
 * Authentication state interface
 */
interface AuthState {
  // State
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  storageMode: StorageMode;

  // Actions
  setUser: (user: User | null) => void;
  setSession: (session: Session | null) => void;
  setLoading: (loading: boolean) => void;
  setStorageMode: (mode: StorageMode) => void;
  signOut: () => void;
}

/**
 * Zustand store for authentication state
 * Uses devtools for Redux DevTools integration
 * Uses persist to save storageMode to localStorage
 */
export const useAuthStore = create<AuthState>()(
  devtools(
    persist(
      (set) => ({
        // Initial state
        user: null,
        session: null,
        isLoading: true,
        storageMode: 'local',

        // Actions
        setUser: (user) => set({ user }),
        setSession: (session) => set({ session, user: session?.user ?? null }),
        setLoading: (isLoading) => set({ isLoading }),
        setStorageMode: (storageMode) => set({ storageMode }),
        signOut: () => set({ user: null, session: null, storageMode: 'local' }),
      }),
      {
        name: 'cptracker-auth',
        partialize: (state) => ({ storageMode: state.storageMode }),
      }
    ),
    { name: 'AuthStore' }
  )
);
