/**
 * Minimal Pourfolio sync relay. Run locally:
 *   node scripts/sync-server.mjs
 * Then set VITE_SYNC_URL=http://localhost:3847 (or enter URL in Settings → Cloud sync).
 */
import http from 'node:http'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const PORT = Number(process.env.SYNC_PORT ?? 3847)
const DATA_DIR = path.join(__dirname, '..', 'sync-data')

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true })
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = []
    req.on('data', (chunk) => chunks.push(chunk))
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')))
    req.on('error', reject)
  })
}

function safeRoomId(roomId) {
  return roomId.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 64)
}

function fileForRoom(roomId) {
  return path.join(DATA_DIR, `${safeRoomId(roomId)}.json`)
}

const server = http.createServer(async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    res.writeHead(204)
    res.end()
    return
  }

  const match = req.url?.match(/^\/sync\/([^/?#]+)/)
  if (!match) {
    res.writeHead(404, { 'Content-Type': 'text/plain' })
    res.end('Not found')
    return
  }

  const roomId = safeRoomId(match[1])
  const filePath = fileForRoom(roomId)

  if (req.method === 'GET') {
    if (!fs.existsSync(filePath)) {
      res.writeHead(404, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ error: 'No sync data for this room' }))
      return
    }
    const raw = fs.readFileSync(filePath, 'utf8')
    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(raw)
    return
  }

  if (req.method === 'POST') {
    try {
      const body = JSON.parse(await readBody(req))
      const incomingTs = Number(body.syncUpdatedAt ?? 0)
      let existingTs = 0
      if (fs.existsSync(filePath)) {
        const existing = JSON.parse(fs.readFileSync(filePath, 'utf8'))
        existingTs = Number(existing.syncUpdatedAt ?? 0)
      }
      if (existingTs > incomingTs) {
        res.writeHead(409, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ error: 'Remote copy is newer', syncUpdatedAt: existingTs }))
        return
      }
      const record = {
        roomId,
        payload: String(body.payload ?? ''),
        syncUpdatedAt: incomingTs || Date.now(),
        updatedAt: new Date().toISOString(),
      }
      fs.writeFileSync(filePath, JSON.stringify(record))
      res.writeHead(200, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ ok: true, syncUpdatedAt: record.syncUpdatedAt }))
    } catch (err) {
      res.writeHead(400, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ error: err instanceof Error ? err.message : 'Bad request' }))
    }
    return
  }

  res.writeHead(405, { 'Content-Type': 'text/plain' })
  res.end('Method not allowed')
})

server.listen(PORT, () => {
  console.log(`Pourfolio sync server listening on http://localhost:${PORT}`)
  console.log(`Data directory: ${DATA_DIR}`)
})
