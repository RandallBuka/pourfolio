import { parseLabelText, type ParsedLabel } from './labelParse'

export type { ParsedLabel }

export async function recognizeLabelFromImage(
  imageDataUrl: string,
  onProgress?: (percent: number, status: string) => void
): Promise<ParsedLabel> {
  onProgress?.(0, 'Loading OCR engine…')

  const { createWorker } = await import('tesseract.js')
  const worker = await createWorker('eng', 1, {
    logger: (message) => {
      if (message.status === 'recognizing text' && typeof message.progress === 'number') {
        onProgress?.(Math.round(message.progress * 100), 'Reading label text…')
      }
    },
  })

  try {
    onProgress?.(5, 'Reading label text…')
    const { data } = await worker.recognize(imageDataUrl)
    onProgress?.(100, 'Parsing label…')
    return parseLabelText(data.text)
  } finally {
    await worker.terminate()
  }
}

export { parseLabelText }
