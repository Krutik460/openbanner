import { useEffect, useState } from 'react'

/** Decodes an image URL for drawing on the canvas. */
export function useImage(src: string | undefined): HTMLImageElement | undefined {
  const [loaded, setLoaded] = useState<{ src: string; image: HTMLImageElement }>()
  useEffect(() => {
    if (!src) return
    const image = new Image()
    image.onload = () => setLoaded({ src, image })
    image.src = src
    return () => {
      image.onload = null
    }
  }, [src])
  return loaded && loaded.src === src ? loaded.image : undefined
}
