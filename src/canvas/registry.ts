import Konva from 'konva'
import { BANNER } from '@/lib/constants'

/** The live Konva group holding the banner's content, registered by the editor stage. */
let content: Konva.Group | null = null

export function registerContent(group: Konva.Group | null): void {
  content = group
}

export function getContent(): Konva.Group | null {
  return content
}

/**
 * Renders the banner on its own at exactly BANNER size times `pixelRatio`,
 * independent of the editor's zoom, overlays and rounded preview corners.
 */
export function renderBanner(pixelRatio: number): HTMLCanvasElement {
  if (!content) throw new Error('The canvas is not ready yet')
  const stage = new Konva.Stage({ container: document.createElement('div'), width: BANNER.width, height: BANNER.height })
  const layer = new Konva.Layer()
  stage.add(layer)
  layer.add(content.clone({ x: 0, y: 0, scaleX: 1, scaleY: 1 }))
  const canvas = stage.toCanvas({ pixelRatio })
  stage.destroy()
  return canvas
}
