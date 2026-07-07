import { compressImageDataUrl, readImageFileAsDataUrl } from './labelPhoto'

const BAR_MAX_WIDTH = 720

export async function captureBarPhoto(file: File): Promise<string> {
  const raw = await readImageFileAsDataUrl(file)
  return compressImageDataUrl(raw, BAR_MAX_WIDTH)
}
