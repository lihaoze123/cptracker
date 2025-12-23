import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import type { User, Session } from '@supabase/supabase-js';
import type { StorageMode } from '@/lib/storage-mode';
import { createClient } from '@/lib/supabase/client';

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

  // Initialization
  initialize: () => void;
}

/**
 * Zustand store for authentication state
 * Uses devtools for Redux DevTools integration
 * Uses persist to save storageMode to localStorage
 *
 * This store directly handles Supabase auth state changes
 */
export const useAuthStore = create<AuthState>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial state
        user: null,
        session: null,
        isLoading: true,
        storageMode: 'local',

        // Actions
        setUser: (user) => set({ user }),
        setSession: (session) => set({ session, user: session?.user ?? null }),
        setLoading: (isLoading) => set({ isLoading }),
        setStorageMode: (storageMode) => {
          set({ storageMode });
          // Also save to localStorage for backward compatibility
          if (typeof window !== 'undefined') {
            localStorage.setItem('cptracker_storage_mode', storageMode);
          }
        },
        signOut: async () => {
          const supabase = createClient();
          await supabase.auth.signOut();
          set({ user: null, session: null, storageMode: 'local' });
        },

        // Initialize auth state from Supabase
        initialize: async () => {
          const supabase = createClient();

          // Get initial session
          const {
            data: { session: initialSession },
          } = await supabase.auth.getSession();
          get().setSession(initialSession);
          get().setLoading(false);

          // Listen for auth state changes
          const {
            data: { subscription },
          } = supabase.auth.onAuthStateChange((_event, newSession) => {
            get().setSession(newSession);
            get().setLoading(false);
          });

          // Cleanup subscription on store unmount (if needed in the future)
          return () => {
            subscription.unsubscribe();
          };
        },
      }),
      {
        name: 'cptracker-auth',
        partialize: (state) => ({ storageMode: state.storageMode }),
      }
    ),
    { name: 'AuthStore' }
  )
);

// Auto-initialize the store when this module is imported
// This ensures Supabase auth state is synced with Zustand store
if (typeof window !== 'undefined') {
  useAuthStore.getState().initialize();
}
