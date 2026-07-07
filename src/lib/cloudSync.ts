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

export type SyncCredentials =
  | { mode: 'auth'; userId: string }
  | { mode: 'passphrase'; passphrase: string }

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

async function readPayload(raw: string, encrypted: boolean, passphrase?: string): Promise<SyncPayload> {
  const plaintext = encrypted
    ? await decryptPayload(passphrase!, raw)
    : raw
  const parsed = JSON.parse(plaintext) as SyncPayload
  if (!parsed.state?.bars?.length) throw new Error('Remote sync data is invalid')
  return parsed
}

export async function pushSyncState(
  config: SyncConfig,
  state: AppState,
  credentials: SyncCredentials
): Promise<SyncConfig> {
  const payload = buildPayload({ ...state, syncUpdatedAt: Date.now() })

  if (credentials.mode === 'auth') {
    if (!isSupabaseConfigured()) throw new Error('Cloud sync is not configured')
    await supabasePushSync(credentials.userId, JSON.stringify(payload), payload.syncUpdatedAt)
  } else {
    if (!config.roomId) throw new Error('Sync is not set up — enter your passphrase first')
    const encrypted = await encryptPayload(credentials.passphrase, JSON.stringify(payload))

    if (isSupabaseConfigured()) {
      throw new Error('Sign in with Google to sync — passphrase sync is for self-hosted servers only')
    }

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
    passphrase:
      credentials.mode === 'passphrase' && config.rememberPassphrase
        ? credentials.passphrase
        : config.passphrase,
  }
}

export async function pullSyncState(
  config: SyncConfig,
  credentials: SyncCredentials
): Promise<SyncPayload | null> {
  if (credentials.mode === 'auth') {
    if (!isSupabaseConfigured()) throw new Error('Cloud sync is not configured')
    const remote = await supabasePullSync(credentials.userId)
    if (!remote) return null
    return readPayload(remote.payload, false)
  }

  if (!config.roomId) throw new Error('Sync is not set up — enter your passphrase first')

  if (isSupabaseConfigured()) {
    throw new Error('Sign in with Google to sync — passphrase sync is for self-hosted servers only')
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
  return readPayload(remote.payload, true, credentials.passphrase)
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

export function isSyncConfigured(config: SyncConfig, userId?: string | null): boolean {
  if (isSupabaseConfigured()) return !!userId
  return !!config.roomId && !!getSyncServerUrl(config)
}

export { isSupabaseConfigured } from './supabaseSync'
