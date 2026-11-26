import { useEffect, useState } from 'react'
import { loadAssetBlob, saveAsset, type AssetMeta } from './storage'
import { loadImage, uid } from './util'

const MAX_EDGE = 2400
const images = new Map<string, HTMLImageElement>()
const pending = new Map<string, Promise<HTMLImageElement | undefined>>()

function loadAssetImage(id: string): Promise<HTMLImageElement | undefined> {
  let promise = pending.get(id)
  if (!promise) {
    promise = loadAssetBlob(id)
      .then((blob) => (blob ? loadImage(URL.createObjectURL(blob)) : undefined))
      .then((image) => {
        if (image) images.set(id, image)
        return image
      })
      .catch(() => undefined)
    pending.set(id, promise)
  }
  return promise
}

/** Decoded image for a stored asset, or undefined while loading / if it is gone. */
export function useAssetImage(id: string | undefined): HTMLImageElement | undefined {
  const [, bump] = useState(0)
  useEffect(() => {
    if (!id || images.has(id)) return
    let live = true
    loadAssetImage(id).then(() => live && bump((n) => n + 1))
    return () => {
      live = false
    }
  }, [id])
  return id ? images.get(id) : undefined
}

function toBlob(canvas: HTMLCanvasElement, type: string, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) =>
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('Could not encode image'))), type, quality),
  )
}

/** Stores an uploaded image (downscaled if huge, so browser storage stays reasonable). */
export async function importImage(file: Blob, name = 'Image'): Promise<AssetMeta> {
  if (!file.type.startsWith('image/')) throw new Error('That file is not an image')
  const url = URL.createObjectURL(file)
  let image: HTMLImageElement
  try {
    image = await loadImage(url)
  } catch {
    URL.revokeObjectURL(url)
    throw new Error('That image could not be read')
  }

  let blob = file
  let { naturalWidth: width, naturalHeight: height } = image
  // SVGs without intrinsic size report 0; give them a sensible box.
  if (!width || !height) {
    width = 512
    height = 512
  }
  const scale = Math.min(1, MAX_EDGE / Math.max(width, height))
  if (scale < 1) {
    width = Math.round(width * scale)
    height = Math.round(height * scale)
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    canvas.getContext('2d')!.drawImage(image, 0, 0, width, height)
    blob = await toBlob(canvas, file.type === 'image/jpeg' ? 'image/jpeg' : 'image/webp', 0.9)
  }
  URL.revokeObjectURL(url)

  const meta: AssetMeta = { id: uid(), name, width, height }
  await saveAsset(meta, blob)
  return meta
}

/** Square, small copy of a photo for the profile preview. */
export async function toAvatarDataUrl(file: Blob, size = 400): Promise<string> {
  const url = URL.createObjectURL(file)
  try {
    const image = await loadImage(url)
    const edge = Math.min(image.naturalWidth, image.naturalHeight)
    const canvas = document.createElement('canvas')
    canvas.width = canvas.height = size
    canvas
      .getContext('2d')!
      .drawImage(image, (image.naturalWidth - edge) / 2, (image.naturalHeight - edge) / 2, edge, edge, 0, 0, size, size)
    return canvas.toDataURL('image/jpeg', 0.88)
  } finally {
    URL.revokeObjectURL(url)
  }
}
