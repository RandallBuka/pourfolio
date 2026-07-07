import type { Session, User } from '@supabase/supabase-js'
import { getSupabaseClient, isSupabaseConfigured } from './supabaseClient'

export function getAuthRedirectUrl(): string {
  if (typeof window === 'undefined') {
    return 'https://randallbuka.github.io/pourfolio/'
  }
  const base = import.meta.env.BASE_URL.replace(/\/?$/, '/')
  return `${window.location.origin}${base}`
}

export async function initSupabaseAuth(): Promise<Session | null> {
  if (!isSupabaseConfigured()) return null
  const sb = getSupabaseClient()
  const { data, error } = await sb.auth.getSession()
  if (error) throw error
  return data.session
}

export function hasAuthCallbackInUrl(): boolean {
  if (typeof window === 'undefined') return false
  const search = window.location.search
  const hash = window.location.hash
  return (
    search.includes('code=') ||
    search.includes('error=') ||
    hash.includes('access_token=') ||
    hash.includes('error=')
  )
}

export function cleanAuthParamsFromUrl(): void {
  if (typeof window === 'undefined') return
  const base = import.meta.env.BASE_URL.replace(/\/?$/, '/')
  const target = `${window.location.origin}${base}#/`
  window.history.replaceState(null, '', target)
}

export async function signInWithGoogle(): Promise<void> {
  const sb = getSupabaseClient()
  const { error } = await sb.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: getAuthRedirectUrl() },
  })
  if (error) throw error
}

export async function signOutGoogle(): Promise<void> {
  const sb = getSupabaseClient()
  const { error } = await sb.auth.signOut()
  if (error) throw error
}

export async function getAuthSession(): Promise<Session | null> {
  const sb = getSupabaseClient()
  const { data, error } = await sb.auth.getSession()
  if (error) throw error
  return data.session
}

export function onAuthStateChange(callback: (user: User | null) => void): () => void {
  const sb = getSupabaseClient()
  const { data } = sb.auth.onAuthStateChange((_event, session) => {
    callback(session?.user ?? null)
  })
  return () => data.subscription.unsubscribe()
}
