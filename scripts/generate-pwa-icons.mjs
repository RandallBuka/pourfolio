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

async function hasCommittedIcons() {
  return (
    (await exists(path.join(outDir, 'icon-192.png'))) &&
    (await exists(path.join(outDir, 'icon-512.png'))) &&
    (await exists(path.join(outDir, 'apple-touch-icon.png')))
  )
}

async function main() {
  if (await hasCommittedIcons()) {
    console.log('generate-pwa-icons: using committed PNG icons')
    return
  }

  let sharp
  try {
    sharp = (await import('sharp')).default
  } catch {
    console.warn('generate-pwa-icons: sharp not installed; run npm i -D sharp locally if icons are missing')
    return
  }

  const sizes = [
    ['icon-192.png', 192],
    ['icon-512.png', 512],
    ['apple-touch-icon.png', 180],
  ]

  try {
    for (const [name, size] of sizes) {
      await sharp(svgPath).resize(size, size).png().toFile(path.join(outDir, name))
      console.log(`generate-pwa-icons: wrote ${name}`)
    }
  } catch (error) {
    console.warn('generate-pwa-icons: could not render SVG (optional):', error)
  }
}

await main()
