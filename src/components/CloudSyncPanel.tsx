import { useState } from 'react'
import type { User } from '@supabase/supabase-js'
import { useApp } from '../context/AppContext'
import {
  getSyncServerUrl,
  isSupabaseConfigured,
  isSyncConfigured,
  setupSyncPassphrase,
} from '../lib/cloudSync'
import { getSupabaseProjectUrl } from '../lib/supabaseClient'

export function CloudSyncPanel() {
  const {
    syncConfig,
    saveSyncConfig,
    pushCloudSync,
    pullCloudSync,
    authUser,
    authReady,
    signInWithGoogle,
    signOutGoogle,
  } = useApp()
  const [passphrase, setPassphrase] = useState(syncConfig.passphrase ?? '')
  const [serverUrl, setServerUrl] = useState(syncConfig.serverUrl)
  const [msg, setMsg] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [authBusy, setAuthBusy] = useState(false)

  const hosted = isSupabaseConfigured()
  const supabaseUrl = getSupabaseProjectUrl()
  const configured = isSyncConfigured({ ...syncConfig, serverUrl }, authUser?.id)

  const applySettings = async () => {
    try {
      let next = {
        ...syncConfig,
        serverUrl: serverUrl.trim(),
        rememberPassphrase: true,
      }
      if (passphrase.trim()) {
        next = await setupSyncPassphrase(next, passphrase)
        next.passphrase = passphrase
      }
      saveSyncConfig(next)
      setMsg('Sync settings saved')
    } catch (err) {
      setMsg(err instanceof Error ? err.message : 'Could not save sync settings')
    }
  }

  const runPush = async () => {
    if (hosted && !authUser) {
      setMsg('Sign in with Google first')
      return
    }
    if (!hosted && !passphrase.trim()) {
      setMsg('Enter your sync passphrase first')
      return
    }
    setBusy(true)
    try {
      await pushCloudSync(hosted ? undefined : passphrase)
      setMsg('Uploaded to cloud')
    } catch (err) {
      setMsg(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setBusy(false)
    }
  }

  const runPull = async () => {
    if (hosted && !authUser) {
      setMsg('Sign in with Google first')
      return
    }
    if (!hosted && !passphrase.trim()) {
      setMsg('Enter your sync passphrase first')
      return
    }
    setBusy(true)
    try {
      const result = await pullCloudSync(hosted ? undefined : passphrase)
      setMsg(
        result === 'updated'
          ? 'Downloaded newer data from cloud'
          : result === 'empty'
            ? 'No cloud copy yet — upload from another device first'
            : 'Already up to date'
      )
    } catch (err) {
      setMsg(err instanceof Error ? err.message : 'Download failed')
    } finally {
      setBusy(false)
    }
  }

  const handleGoogleSignIn = async () => {
    setAuthBusy(true)
    setMsg(null)
    try {
      await signInWithGoogle()
    } catch (err) {
      setMsg(err instanceof Error ? err.message : 'Google sign-in failed')
      setAuthBusy(false)
    }
  }

  const handleSignOut = async () => {
    setAuthBusy(true)
    try {
      await signOutGoogle()
      setMsg('Signed out')
    } catch (err) {
      setMsg(err instanceof Error ? err.message : 'Sign-out failed')
    } finally {
      setAuthBusy(false)
    }
  }

  const userLabel =
    authUser?.user_metadata?.full_name ||
    authUser?.user_metadata?.name ||
    authUser?.email ||
    'Signed in'

  return (
    <div className="cloud-sync-panel">
      {hosted ? (
        <>
          <p className="modal-hint">
            <strong>Cloud sync is on.</strong> Sign in with Google on each device to keep your bar in sync automatically.
          </p>
          {!supabaseUrl && (
            <p className="field-error">
              Supabase URL looks invalid. GitHub secret <code>VITE_SUPABASE_URL</code> must be{' '}
              <code>https://YOUR_REF.supabase.co</code> — not the publishable key, database URL, or Google secret.
            </p>
          )}

          {!authReady ? (
            <p className="modal-hint">Checking sign-in…</p>
          ) : authUser ? (
            <div className="cloud-sync-account">
              <p className="cloud-sync-signed-in">Signed in as {userLabel}</p>
              <button
                type="button"
                className="btn btn-secondary"
                disabled={authBusy}
                onClick={() => { void handleSignOut() }}
              >
                Sign out
              </button>
            </div>
          ) : (
            <button
              type="button"
              className="btn btn-google"
              disabled={authBusy}
              onClick={() => { void handleGoogleSignIn() }}
            >
              Continue with Google
            </button>
          )}
        </>
      ) : (
        <p className="modal-hint">
          Use the same passphrase on every device. Data is encrypted before upload. Set up Supabase (see{' '}
          <code>supabase/schema.sql</code>) or run <code>npm run sync:server</code> locally.
        </p>
      )}

      {!hosted && (
        <>
          <label className="field-label">Sync server URL</label>
          <input
            value={serverUrl}
            onChange={(e) => setServerUrl(e.target.value)}
            placeholder="http://localhost:3847"
          />

          <label className="field-label">Sync passphrase</label>
          <input
            type="password"
            value={passphrase}
            onChange={(e) => setPassphrase(e.target.value)}
            placeholder="At least 8 characters — same on all devices"
          />
        </>
      )}

      <div className="filter-toggle-row">
        <span>Auto-sync (pull on open + upload after changes)</span>
        <button
          type="button"
          className={`toggle ${syncConfig.enabled ? 'on' : ''}`}
          onClick={() =>
            saveSyncConfig({
              ...syncConfig,
              enabled: !syncConfig.enabled,
              serverUrl,
              passphrase: syncConfig.rememberPassphrase ? passphrase : syncConfig.passphrase,
            })
          }
          aria-pressed={syncConfig.enabled}
          disabled={hosted && !authUser}
        />
      </div>

      <div className="detail-actions">
        {!hosted && (
          <button type="button" className="btn btn-secondary" onClick={() => { void applySettings() }}>
            Save sync setup
          </button>
        )}
        <button type="button" className="btn btn-primary" disabled={busy || !configured} onClick={() => { void runPush() }}>
          Upload now
        </button>
        <button type="button" className="btn btn-secondary" disabled={busy || !configured} onClick={() => { void runPull() }}>
          Download now
        </button>
      </div>

      {syncConfig.lastSyncedAt && (
        <p className="modal-hint">Last synced: {new Date(syncConfig.lastSyncedAt).toLocaleString()}</p>
      )}
      {syncConfig.lastSyncError && <p className="field-error">{syncConfig.lastSyncError}</p>}
      {msg && <p className="shopping-flash">{msg}</p>}
      {!hosted && !getSyncServerUrl({ ...syncConfig, serverUrl }) && (
        <p className="field-note">Set a sync server URL or configure Supabase env vars to enable cloud sync.</p>
      )}
      {hosted && authReady && !authUser && (
        <p className="field-note">Turn on auto-sync after signing in with Google.</p>
      )}
    </div>
  )
}
