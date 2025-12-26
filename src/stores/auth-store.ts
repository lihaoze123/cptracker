import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import type { User, Session } from '@supabase/supabase-js';
import type { StorageMode } from '@/lib/storage-mode';
import { getSupabaseClient, isSupabaseConfigured } from '@/lib/supabase/lazy-client';

/**
 * Authentication state interface
 */
interface AuthState {
  // State
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  storageMode: StorageMode;
  isInitialized: boolean;
  _hasHydrated: boolean;

  // Actions
  setUser: (user: User | null) => void;
  setSession: (session: Session | null) => void;
  setLoading: (loading: boolean) => void;
  setStorageMode: (mode: StorageMode) => void;
  signOut: () => Promise<void>;
  setHasHydrated: (state: boolean) => void;

  // Initialization
  initialize: () => Promise<void>;
  initializeIfNeeded: () => Promise<void>;
}

/**
 * Zustand store for authentication state
 * Uses devtools for Redux DevTools integration
 * Uses persist to save storageMode to localStorage
 *
 * This store lazily loads Supabase only when needed (cloud mode)
 */
export const useAuthStore = create<AuthState>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial state
        user: null,
        session: null,
        isLoading: false, // Start with false, set to true only when initializing
        storageMode: 'local',
        isInitialized: false,
        _hasHydrated: false,

        // Actions
        setUser: (user) => set({ user }),
        setSession: (session) => set({ session, user: session?.user ?? null }),
        setLoading: (isLoading) => set({ isLoading }),
        setHasHydrated: (state) => set({ _hasHydrated: state }),
        setStorageMode: async (storageMode) => {
          set({ storageMode });
          // Also save to localStorage for backward compatibility
          if (typeof window !== 'undefined') {
            localStorage.setItem('cptracker_storage_mode', storageMode);
          }
          // If switching to cloud mode, ensure Supabase is initialized
          if (storageMode === 'cloud') {
            await get().initializeIfNeeded();
          }
        },
        signOut: async () => {
          const supabase = await getSupabaseClient();
          await supabase.auth.signOut();
          set({ user: null, session: null, storageMode: 'local' });
        },

        // Initialize auth state from Supabase (lazy)
        initialize: async () => {
          if (!isSupabaseConfigured()) {
            set({ isLoading: false, isInitialized: true });
            return;
          }

          set({ isLoading: true });

          const supabase = await getSupabaseClient();

          // Get initial session
          const {
            data: { session: initialSession },
          } = await supabase.auth.getSession();
          get().setSession(initialSession);
          set({ isLoading: false, isInitialized: true });

          // Listen for auth state changes
          supabase.auth.onAuthStateChange((_event, newSession) => {
            get().setSession(newSession);
            get().setLoading(false);
          });
        },

        // Initialize only if needed (cloud mode or has previous session)
        initializeIfNeeded: async () => {
          if (get().isInitialized) return;

          const { storageMode } = get();

          // Only initialize Supabase if:
          // 1. User is in cloud mode, OR
          // 2. There might be a previous session (check localStorage)
          const shouldInitialize =
            storageMode === 'cloud' ||
            (typeof window !== 'undefined' && localStorage.getItem('cptracker-auth'));

          if (shouldInitialize && isSupabaseConfigured()) {
            await get().initialize();
          } else {
            set({ isLoading: false, isInitialized: true });
          }
        },
      }),
      {
        name: 'cptracker-auth',
        partialize: (state) => ({ storageMode: state.storageMode }),
        onRehydrateStorage: () => (state) => {
          // Called after state is rehydrated from localStorage
          if (state) {
            state.setHasHydrated(true);
            // Initialize after rehydration if needed
            state.initializeIfNeeded();
          }
        },
      }
    ),
    { name: 'AuthStore' }
  )
);
