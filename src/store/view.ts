import { create } from 'zustand'
import { clamp } from '@/lib/util'

export const MIN_ZOOM = 0.1
export const MAX_ZOOM = 4

/** Pan and zoom of the workspace: screen = offset + banner * scale. */
interface ViewState {
  x: number
  y: number
  scale: number
  /** Size of the workspace viewport in CSS pixels. */
  width: number
  height: number
  /** Height of the profile card preview in banner pixels (0 until measured). */
  cardHeight: number
  /** On-screen box around the current selection (handles included), or null while there is none or it is moving. */
  frame: { x: number; y: number; width: number; height: number } | null
  /** False once the person pans or zooms, so resizing stops re-fitting. */
  fitted: boolean
  set: (view: Partial<Pick<ViewState, 'x' | 'y' | 'scale' | 'width' | 'height' | 'cardHeight' | 'frame' | 'fitted'>>) => void
  /** Zoom keeping the given screen point (default: viewport centre) stationary. */
  zoomTo: (scale: number, anchor?: { x: number; y: number }) => void
  panBy: (dx: number, dy: number) => void
}

export const useView = create<ViewState>((set, get) => ({
  x: 0,
  y: 0,
  scale: 0.5,
  width: 0,
  height: 0,
  cardHeight: 0,
  frame: null,
  fitted: true,
  set: (view) => set(view),
  zoomTo: (target, anchor) => {
    const { x, y, scale, width, height } = get()
    const next = clamp(target, MIN_ZOOM, MAX_ZOOM)
    const a = anchor ?? { x: width / 2, y: height / 2 }
    set({
      scale: next,
      x: a.x - ((a.x - x) / scale) * next,
      y: a.y - ((a.y - y) / scale) * next,
      fitted: false,
    })
  },
  panBy: (dx, dy) => set({ x: get().x + dx, y: get().y + dy, fitted: false }),
}))
