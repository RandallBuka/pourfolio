const MAX_WIDTH = 900
const JPEG_QUALITY = 0.82

export function readImageFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(new Error('Could not read image'))
    reader.readAsDataURL(file)
  })
}

export async function compressImageDataUrl(dataUrl: string, maxWidth = MAX_WIDTH): Promise<string> {
  if (!dataUrl.startsWith('data:image/')) return dataUrl

  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      const scale = Math.min(1, maxWidth / img.width)
      const width = Math.round(img.width * scale)
      const height = Math.round(img.height * scale)
      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        resolve(dataUrl)
        return
      }
      ctx.drawImage(img, 0, 0, width, height)
      resolve(canvas.toDataURL('image/jpeg', JPEG_QUALITY))
    }
    img.onerror = () => reject(new Error('Could not load image'))
    img.src = dataUrl
  })
}

export async function captureLabelPhoto(file: File): Promise<string> {
  const raw = await readImageFileAsDataUrl(file)
  return compressImageDataUrl(raw)
}
