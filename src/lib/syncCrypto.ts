const PBKDF2_ITERATIONS = 120_000

function bufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer)
  let binary = ''
  bytes.forEach((b) => { binary += String.fromCharCode(b) })
  return btoa(binary)
}

function base64ToBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64)
  const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0))
  return bytes.buffer
}

export async function deriveSyncRoomId(passphrase: string): Promise<string> {
  const enc = new TextEncoder()
  const hash = await crypto.subtle.digest('SHA-256', enc.encode(passphrase.trim()))
  return bufferToBase64(hash).replace(/[^a-zA-Z0-9]/g, '').slice(0, 32)
}

async function deriveKey(passphrase: string, salt: Uint8Array): Promise<CryptoKey> {
  const enc = new TextEncoder()
  const baseKey = await crypto.subtle.importKey(
    'raw',
    enc.encode(passphrase.trim()),
    'PBKDF2',
    false,
    ['deriveKey']
  )
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations: PBKDF2_ITERATIONS, hash: 'SHA-256' },
    baseKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  )
}

export async function encryptPayload(passphrase: string, plaintext: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16))
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const key = await deriveKey(passphrase, salt)
  const enc = new TextEncoder()
  const cipher = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, enc.encode(plaintext))
  return JSON.stringify({
    v: 1,
    salt: bufferToBase64(salt.buffer),
    iv: bufferToBase64(iv.buffer),
    data: bufferToBase64(cipher),
  })
}

export async function decryptPayload(passphrase: string, envelopeJson: string): Promise<string> {
  const envelope = JSON.parse(envelopeJson) as { v: number; salt: string; iv: string; data: string }
  if (envelope.v !== 1) throw new Error('Unsupported sync encryption version')
  const salt = new Uint8Array(base64ToBuffer(envelope.salt))
  const iv = new Uint8Array(base64ToBuffer(envelope.iv))
  const key = await deriveKey(passphrase, salt)
  const plain = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    key,
    base64ToBuffer(envelope.data)
  )
  return new TextDecoder().decode(plain)
}
