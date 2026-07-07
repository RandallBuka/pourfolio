import { copyFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const dist = path.join(__dirname, '..', 'dist')

/** GitHub Pages serves 404.html for unknown paths — SPA fallback for direct links. */
await copyFile(path.join(dist, 'index.html'), path.join(dist, '404.html'))
console.log('postbuild: copied index.html -> 404.html')
