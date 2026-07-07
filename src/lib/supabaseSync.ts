import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

let client: SupabaseClient | null = null

export function isSupabaseConfigured(): boolean {
  return !!(url && anonKey)
}

function getClient(): SupabaseClient {
  if (!url || !anonKey) throw new Error('Supabase is not configured')
  if (!client) client = createClient(url, anonKey)
  return client
}

export async function supabasePushSync(
  roomId: string,
  payload: string,
  syncUpdatedAt: number
): Promise<void> {
  const sb = getClient()
  const { error } = await sb.from('pourfolio_sync').upsert(
    {
      room_id: roomId,
      payload,
      sync_updated_at: syncUpdatedAt,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'room_id' }
  )
  if (error) throw new Error(error.message)
}

export async function supabasePullSync(roomId: string): Promise<{
  payload: string
  syncUpdatedAt: number
} | null> {
  const sb = getClient()
  const { data, error } = await sb
    .from('pourfolio_sync')
    .select('payload, sync_updated_at')
    .eq('room_id', roomId)
    .maybeSingle()

  if (error) throw new Error(error.message)
  if (!data) return null

  return {
    payload: data.payload as string,
    syncUpdatedAt: Number(data.sync_updated_at),
  }
}
