import {
  createContext,
  useContext,
  useEffect,
  type ReactNode,
} from "react";
import type { User, Session } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { setStorageMode, type StorageMode } from "@/lib/storage-mode";
import { useAuthStore } from "@/stores/auth-store";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  storageMode: StorageMode;
  setStorageMode: (mode: StorageMode) => void;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * AuthProvider now acts as a thin wrapper around Zustand store.
 * The actual state is managed in useAuthStore, this provider handles:
 * - Supabase auth state synchronization
 * - Initial session loading
 * - Sign out functionality
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  // Use Zustand store as the single source of truth
  const { user, session, isLoading, storageMode, setStorageMode: setStoreStorageMode, signOut: storeSignOut } = useAuthStore();

  const supabase = createClient();

  useEffect(() => {
    // Initialize auth state from Supabase
    const initAuth = async () => {
      try {
        const {
          data: { session: initialSession },
        } = await supabase.auth.getSession();

        // Update Zustand store with initial session
        useAuthStore.getState().setSession(initialSession);
        useAuthStore.getState().setLoading(false);
      } catch {
        // Ignore errors, user not logged in
        useAuthStore.getState().setLoading(false);
      }
    };

    initAuth();

    // Listen for auth state changes and update Zustand store
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, newSession) => {
      useAuthStore.getState().setSession(newSession);
      useAuthStore.getState().setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase.auth]);

  const handleSetStorageMode = (mode: StorageMode) => {
    setStorageMode(mode);
    setStoreStorageMode(mode);
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    storeSignOut();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        isLoading,
        storageMode,
        setStorageMode: handleSetStorageMode,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
