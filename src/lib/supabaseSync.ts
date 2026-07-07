import { getSupabaseClient } from './supabaseClient'

export { isSupabaseConfigured } from './supabaseClient'

export async function supabasePushSync(
  userId: string,
  payload: string,
  syncUpdatedAt: number
): Promise<void> {
  const sb = getSupabaseClient()
  const { error } = await sb.from('pourfolio_sync').upsert(
    {
      user_id: userId,
      payload,
      sync_updated_at: syncUpdatedAt,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id' }
  )
  if (error) throw new Error(error.message)
}

export async function supabasePullSync(userId: string): Promise<{
  payload: string
  syncUpdatedAt: number
} | null> {
  const sb = getSupabaseClient()
  const { data, error } = await sb
    .from('pourfolio_sync')
    .select('payload, sync_updated_at')
    .eq('user_id', userId)
    .maybeSingle()

  if (error) throw new Error(error.message)
  if (!data) return null

  return {
    payload: data.payload as string,
    syncUpdatedAt: Number(data.sync_updated_at),
  }
}
