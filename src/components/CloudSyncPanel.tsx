import { useState } from 'react'
import { useApp } from '../context/AppContext'
import { getSyncServerUrl, isSupabaseConfigured, isSyncConfigured, setupSyncPassphrase } from '../lib/cloudSync'

export function CloudSyncPanel() {
  const { syncConfig, saveSyncConfig, pushCloudSync, pullCloudSync } = useApp()
  const [passphrase, setPassphrase] = useState(syncConfig.passphrase ?? '')
  const [serverUrl, setServerUrl] = useState(syncConfig.serverUrl)
  const [msg, setMsg] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const hosted = isSupabaseConfigured()
  const configured = isSyncConfigured({ ...syncConfig, serverUrl })

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
    if (!passphrase.trim()) {
      setMsg('Enter your sync passphrase first')
      return
    }
    setBusy(true)
    try {
      await pushCloudSync(passphrase)
      setMsg('Uploaded to cloud')
    } catch (err) {
      setMsg(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setBusy(false)
    }
  }

  const runPull = async () => {
    if (!passphrase.trim()) {
      setMsg('Enter your sync passphrase first')
      return
    }
    setBusy(true)
    try {
      const result = await pullCloudSync(passphrase)
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

  return (
    <div className="cloud-sync-panel">
      {hosted ? (
        <p className="modal-hint">
          <strong>Hosted sync enabled.</strong> Data is encrypted with your passphrase before upload to Supabase. Use the same passphrase on every device.
        </p>
      ) : (
        <p className="modal-hint">
          Use the same passphrase on every device. Data is encrypted before upload. Set up Supabase (see <code>supabase/schema.sql</code>) or run <code>npm run sync:server</code> locally.
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
        </>
      )}

      <label className="field-label">Sync passphrase</label>
      <input
        type="password"
        value={passphrase}
        onChange={(e) => setPassphrase(e.target.value)}
        placeholder="At least 8 characters — same on all devices"
      />

      <div className="filter-toggle-row">
        <span>Auto-sync (pull on open + upload after changes)</span>
        <button
          type="button"
          className={`toggle ${syncConfig.enabled ? 'on' : ''}`}
          onClick={() => saveSyncConfig({ ...syncConfig, enabled: !syncConfig.enabled, serverUrl, passphrase: syncConfig.rememberPassphrase ? passphrase : syncConfig.passphrase })}
          aria-pressed={syncConfig.enabled}
        />
      </div>

      <div className="detail-actions">
        <button type="button" className="btn btn-secondary" onClick={() => { void applySettings() }}>
          Save sync setup
        </button>
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
      {syncConfig.lastSyncError && (
        <p className="field-error">{syncConfig.lastSyncError}</p>
      )}
      {msg && <p className="shopping-flash">{msg}</p>}
      {!hosted && !getSyncServerUrl({ ...syncConfig, serverUrl }) && (
        <p className="field-note">Set a sync server URL or configure Supabase env vars to enable cloud sync.</p>
      )}
    </div>
  )
}
