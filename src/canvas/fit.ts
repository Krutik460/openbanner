import { AVATAR, BANNER } from '@/lib/constants'
import type { Device } from '@/lib/types'
import { clamp } from '@/lib/util'
import { useEditor } from '@/store/editor'
import { useView } from '@/store/view'

/**
 * How much of the profile preview (banner included) the fit keeps in view, in
 * banner pixels. Desktop shows the whole card; the mobile card is several
 * banners tall, so only its top is kept in view.
 */
function previewHeight(device: Device, cardHeight: number): number {
  const a = AVATAR[device]
  const peek = a.y + a.d + 330
  return device === 'desktop' && cardHeight > 0 ? cardHeight : peek
}

/** Centres the banner (and the visible part of the profile card) in the workspace. */
export function fitView(): void {
  const { width, height, cardHeight } = useView.getState()
  if (!width || !height) return
  const { device, showProfile } = useEditor.getState()
  const pad = { x: width < 700 ? 20 : 72, top: 84, bottom: 96 }
  const contentH = showProfile ? previewHeight(device, cardHeight) : BANNER.height
  const scale = clamp(
    Math.min((width - pad.x * 2) / BANNER.width, (height - pad.top - pad.bottom) / contentH),
    0.12,
    1.25,
  )
  useView.setState({
    scale,
    x: Math.round((width - BANNER.width * scale) / 2),
    y: Math.round(pad.top + Math.max(0, (height - pad.top - pad.bottom - contentH * scale) / 2)),
    fitted: true,
  })
}
