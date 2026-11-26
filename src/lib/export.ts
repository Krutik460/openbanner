import { renderBanner } from '@/canvas/registry'

export type ExportFormat = 'png' | 'jpeg'

export async function exportBanner(format: ExportFormat, pixelRatio: number): Promise<Blob> {
  // Text drawn before its web font arrives would be exported in a fallback face.
  await document.fonts.ready
  const canvas = renderBanner(pixelRatio)
  return new Promise((resolve, reject) =>
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('The image could not be created'))),
      `image/${format}`,
      0.92,
    ),
  )
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export function fileSlug(name: string): string {
  return (
    name
      .toLowerCase()
      .replace(/[^\p{L}\p{N}]+/gu, '-')
      .replace(/^-+|-+$/g, '') || 'banner'
  )
}

export function formatBytes(bytes: number): string {
  return bytes < 1_000_000 ? `${Math.max(1, Math.round(bytes / 1000))} KB` : `${(bytes / 1_000_000).toFixed(1)} MB`
}
