import type { AppState } from '../types'
import { isSupabaseConfigured, supabasePullSync, supabasePushSync } from './supabaseSync'
import { parseBackup } from './backup'
import { decryptPayload, deriveSyncRoomId, encryptPayload } from './syncCrypto'

const SYNC_CONFIG_KEY = 'pourfolio-sync-config-v1'

export interface SyncConfig {
  enabled: boolean
  serverUrl: string
  roomId: string
  rememberPassphrase: boolean
  passphrase?: string
  lastSyncedAt?: string
  lastSyncError?: string
}

export interface SyncPayload {
  syncUpdatedAt: number
  state: AppState
}

export interface RemoteSyncRecord {
  roomId: string
  payload: string
  syncUpdatedAt: number
  updatedAt: string
}

const DEFAULT_SYNC_URL = import.meta.env.VITE_SYNC_URL as string | undefined

export function loadSyncConfig(): SyncConfig {
  try {
    const raw = localStorage.getItem(SYNC_CONFIG_KEY)
    if (!raw) {
      return {
        enabled: false,
        serverUrl: DEFAULT_SYNC_URL ?? '',
        roomId: '',
        rememberPassphrase: true,
      }
    }
    const parsed = JSON.parse(raw) as Partial<SyncConfig>
    return {
      enabled: parsed.enabled ?? false,
      serverUrl: parsed.serverUrl || DEFAULT_SYNC_URL || '',
      roomId: parsed.roomId ?? '',
      rememberPassphrase: parsed.rememberPassphrase ?? true,
      passphrase: parsed.passphrase,
      lastSyncedAt: parsed.lastSyncedAt,
      lastSyncError: parsed.lastSyncError,
    }
  } catch {
    return {
      enabled: false,
      serverUrl: DEFAULT_SYNC_URL ?? '',
      roomId: '',
      rememberPassphrase: true,
    }
  }
}

export function saveSyncConfig(config: SyncConfig): void {
  const toStore: SyncConfig = { ...config }
  if (!config.rememberPassphrase) {
    delete toStore.passphrase
  }
  localStorage.setItem(SYNC_CONFIG_KEY, JSON.stringify(toStore))
}

export function getSyncServerUrl(config: SyncConfig): string {
  return (config.serverUrl || DEFAULT_SYNC_URL || '').replace(/\/$/, '')
}

export async function setupSyncPassphrase(config: SyncConfig, passphrase: string): Promise<SyncConfig> {
  if (passphrase.trim().length < 8) {
    throw new Error('Passphrase must be at least 8 characters')
  }
  const roomId = await deriveSyncRoomId(passphrase)
  return {
    ...config,
    roomId,
    passphrase: config.rememberPassphrase ? passphrase : undefined,
    lastSyncError: undefined,
  }
}

function buildPayload(state: AppState): SyncPayload {
  return {
    syncUpdatedAt: state.syncUpdatedAt ?? Date.now(),
    state,
  }
}

export async function pushSyncState(config: SyncConfig, state: AppState, passphrase: string): Promise<SyncConfig> {
  if (!config.roomId) throw new Error('Sync is not set up — enter your passphrase first')

  const payload = buildPayload({ ...state, syncUpdatedAt: Date.now() })
  const encrypted = await encryptPayload(passphrase, JSON.stringify(payload))

  if (isSupabaseConfigured()) {
    await supabasePushSync(config.roomId, encrypted, payload.syncUpdatedAt)
  } else {
    const baseUrl = getSyncServerUrl(config)
    if (!baseUrl) throw new Error('Sync server URL is not configured')
    const res = await fetch(`${baseUrl}/sync/${config.roomId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        payload: encrypted,
        syncUpdatedAt: payload.syncUpdatedAt,
      }),
    })
    if (!res.ok) {
      const msg = await res.text().catch(() => '')
      throw new Error(msg || `Sync upload failed (${res.status})`)
    }
  }

  const now = new Date().toISOString()
  return {
    ...config,
    lastSyncedAt: now,
    lastSyncError: undefined,
    passphrase: config.rememberPassphrase ? passphrase : config.passphrase,
  }
}

export async function pullSyncState(config: SyncConfig, passphrase: string): Promise<SyncPayload | null> {
  if (!config.roomId) throw new Error('Sync is not set up — enter your passphrase first')

  if (isSupabaseConfigured()) {
    const remote = await supabasePullSync(config.roomId)
    if (!remote) return null
    const decrypted = await decryptPayload(passphrase, remote.payload)
    const parsed = JSON.parse(decrypted) as SyncPayload
    if (!parsed.state?.bars?.length) throw new Error('Remote sync data is invalid')
    return parsed
  }

  const baseUrl = getSyncServerUrl(config)
  if (!baseUrl) throw new Error('Sync server URL is not configured')
  const res = await fetch(`${baseUrl}/sync/${config.roomId}`)
  if (res.status === 404) return null
  if (!res.ok) {
    const msg = await res.text().catch(() => '')
    throw new Error(msg || `Sync download failed (${res.status})`)
  }

  const remote = (await res.json()) as RemoteSyncRecord
  const decrypted = await decryptPayload(passphrase, remote.payload)
  const parsed = JSON.parse(decrypted) as SyncPayload
  if (!parsed.state?.bars?.length) throw new Error('Remote sync data is invalid')
  return parsed
}

export function mergeSyncState(local: AppState, remote: SyncPayload): AppState {
  const localTs = local.syncUpdatedAt ?? 0
  const remoteTs = remote.syncUpdatedAt ?? 0
  if (remoteTs >= localTs) {
    return {
      ...remote.state,
      syncUpdatedAt: remoteTs,
    }
  }
  return local
}

export function applyPulledState(raw: SyncPayload): AppState {
  const state = parseBackup(JSON.stringify({ version: 1, exportedAt: '', app: 'pourfolio', state: raw.state }))
  return {
    ...state,
    syncUpdatedAt: raw.syncUpdatedAt,
  }
}

export function isSyncConfigured(config: SyncConfig): boolean {
  return !!config.roomId && (isSupabaseConfigured() || !!getSyncServerUrl(config))
}

export { isSupabaseConfigured } from './supabaseSync'
