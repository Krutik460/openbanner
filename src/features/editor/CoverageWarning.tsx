import { useEffect, useState } from 'react'
import type Konva from 'konva'
import { EyeOff } from 'lucide-react'
import { getContent } from '@/canvas/registry'
import { AVATAR } from '@/lib/constants'
import type { BannerElement, Device } from '@/lib/types'
import { useEditor } from '@/store/editor'

interface Rect {
  x: number
  y: number
  width: number
  height: number
}

/** The part of the element that actually shows ink (a text box is usually wider than its words). */
function inkBox(el: BannerElement, node: Konva.Node, content: Konva.Group): Rect {
  if (el.type === 'text' && el.rotation === 0) {
    const text = node as Konva.Text
    const inkWidth = Math.min(text.getTextWidth(), el.width)
    const offset = el.align === 'left' ? 0 : el.align === 'center' ? (el.width - inkWidth) / 2 : el.width - inkWidth
    return { x: el.x + offset, y: el.y, width: inkWidth, height: text.height() }
  }
  return node.getClientRect({ relativeTo: content, skipShadow: true })
}

/** True when a meaningful part of the box sits under the photo circle. */
function covered(box: Rect, device: Device): boolean {
  const a = AVATAR[device]
  const r = a.d / 2
  const cx = a.x + r
  const cy = a.y + r
  const nx = Math.max(box.x, Math.min(cx, box.x + box.width))
  const ny = Math.max(box.y, Math.min(cy, box.y + box.height))
  // Ignore grazing contact: require the box to reach well inside the circle.
  return Math.hypot(nx - cx, ny - cy) < r - 14
}

/**
 * Warns when text or an icon is hidden behind the profile photo on desktop or
 * mobile, which is the most common way a banner goes wrong once uploaded.
 */
export function CoverageWarning() {
  const elements = useEditor((s) => s.doc.elements)
  const showSafeZones = useEditor((s) => s.showSafeZones)
  const [hidden, setHidden] = useState<{ count: number; where: string } | null>(null)

  useEffect(() => {
    // Wait a frame so the canvas nodes reflect the latest edit before measuring them.
    const frame = requestAnimationFrame(() => {
      const content = getContent()
      if (!content) return
      let count = 0
      let desktop = false
      let mobile = false
      for (const el of elements) {
        if (el.hidden || (el.type !== 'text' && el.type !== 'icon')) continue
        const node = content.findOne((n: Konva.Node) => n.id() === el.id)
        if (!node) continue
        const box = inkBox(el, node, content)
        const onDesktop = covered(box, 'desktop')
        const onMobile = covered(box, 'mobile')
        if (onDesktop || onMobile) count++
        desktop ||= onDesktop
        mobile ||= onMobile
      }
      setHidden(count ? { count, where: desktop ? 'on your profile' : mobile ? 'on mobile' : '' } : null)
    })
    return () => cancelAnimationFrame(frame)
  }, [elements])

  if (!hidden || showSafeZones) return null
  return (
    <button
      type="button"
      onClick={() => useEditor.getState().setView({ showSafeZones: true })}
      className="absolute bottom-16 left-1/2 z-10 flex h-8 -translate-x-1/2 animate-pop items-center gap-2 rounded-full border border-[#e0a800]/50 bg-[#fff6d6] pr-3 pl-2.5 text-xs whitespace-nowrap text-[#6b4e00] shadow-pop transition-colors hover:bg-[#ffefb8]"
    >
      <EyeOff className="size-3.5" />
      {hidden.count === 1 ? '1 item is' : `${hidden.count} items are`} hidden behind your photo {hidden.where}
      <span className="font-semibold underline underline-offset-2">Show me</span>
    </button>
  )
}
