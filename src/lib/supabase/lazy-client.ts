import type { SupabaseClient } from '@supabase/supabase-js'

let supabaseInstance: SupabaseClient | null = null
let supabasePromise: Promise<SupabaseClient> | null = null

/**
 * Lazily load and initialize Supabase client
 * Only downloads the Supabase SDK when first called
 */
export async function getSupabaseClient(): Promise<SupabaseClient> {
  if (supabaseInstance) {
    return supabaseInstance
  }

  if (supabasePromise) {
    return supabasePromise
  }

  supabasePromise = (async () => {
    const { createClient } = await import('@supabase/supabase-js')
    supabaseInstance = createClient(
      import.meta.env.VITE_SUPABASE_URL!,
      import.meta.env.VITE_SUPABASE_PUBLISHABLE_OR_ANON_KEY!
    )
    return supabaseInstance
  })()

  return supabasePromise
}

/**
 * Synchronous getter - returns null if not yet initialized
 * Use this only when you know Supabase has been initialized
 */
export function getSupabaseClientSync(): SupabaseClient | null {
  return supabaseInstance
}

/**
 * Check if Supabase is configured (env vars present)
 */
export function isSupabaseConfigured(): boolean {
  return !!(
    import.meta.env.VITE_SUPABASE_URL &&
    import.meta.env.VITE_SUPABASE_PUBLISHABLE_OR_ANON_KEY
  )
}
