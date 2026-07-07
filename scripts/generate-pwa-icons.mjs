import { access } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(__dirname, '..')
const svgPath = path.join(root, 'public/icons/icon.svg')
const outDir = path.join(root, 'public/icons')

async function exists(filePath) {
  try {
    await access(filePath)
    return true
  } catch {
    return false
  }
}

async function main() {
  let sharp
  try {
    sharp = (await import('sharp')).default
  } catch {
    const hasPng = (await exists(path.join(outDir, 'icon-192.png'))) && (await exists(path.join(outDir, 'icon-512.png')))
    if (hasPng) {
      console.log('generate-pwa-icons: sharp not installed; existing PNG icons kept')
      return
    }
    console.warn('generate-pwa-icons: install sharp for PNG icons (npm i -D sharp)')
    return
  }

  const sizes = [
    ['icon-192.png', 192],
    ['icon-512.png', 512],
    ['apple-touch-icon.png', 180],
  ]

  for (const [name, size] of sizes) {
    await sharp(svgPath).resize(size, size).png().toFile(path.join(outDir, name))
    console.log(`generate-pwa-icons: wrote ${name}`)
  }
}

await main()
