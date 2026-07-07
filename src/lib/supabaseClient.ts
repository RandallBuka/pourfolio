import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const rawUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

let client: SupabaseClient | null = null

export function normalizeSupabaseUrl(raw: string): string {
  const trimmed = raw.trim().replace(/\/$/, '')
  if (!/^https:\/\/[a-z0-9-]+\.supabase\.co$/i.test(trimmed)) {
    throw new Error(
      'Invalid Supabase URL. In GitHub secrets, VITE_SUPABASE_URL must be exactly https://YOUR_REF.supabase.co (from Supabase → Project Settings → API → Project URL).'
    )
  }
  return trimmed
}

export function getSupabaseProjectUrl(): string | undefined {
  if (!rawUrl?.trim()) return undefined
  try {
    return normalizeSupabaseUrl(rawUrl)
  } catch {
    return undefined
  }
}

export function isSupabaseConfigured(): boolean {
  return !!(getSupabaseProjectUrl() && anonKey?.trim())
}

export function getSupabaseClient(): SupabaseClient {
  const url = getSupabaseProjectUrl()
  const key = anonKey?.trim()
  if (!url || !key) throw new Error('Supabase is not configured')
  if (!client) {
    client = createClient(url, key, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        flowType: 'pkce',
      },
    })
  }
  return client
}
