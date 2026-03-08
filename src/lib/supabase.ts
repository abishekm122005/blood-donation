import { createClient, SupabaseClient } from '@supabase/supabase-js'

let _instance: SupabaseClient | null = null

export function getSupabaseClient(): SupabaseClient {
  if (_instance) return _instance

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !key) {
    throw new Error('Missing Supabase environment variables. Please check your .env.local file.')
  }

  _instance = createClient(url, key)
  return _instance
}

// Legacy export — prefer getSupabaseClient()
export const supabase = (() => {
  try { return getSupabaseClient() } catch { return null }
})()
