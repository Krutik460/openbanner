import type Konva from 'konva'
import { BANNER } from '@/lib/constants'
import { round } from '@/lib/util'
import { useEditor } from '@/store/editor'
import { getContent } from './registry'
import type { Box } from './snapping'

export type AlignMode = 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom'

/** Aligns one element to the banner, or several elements to each other. */
export function alignSelection(mode: AlignMode): void {
  const content = getContent()
  if (!content) return
  const { selection, doc, patchElements } = useEditor.getState()
  const boxes = new Map<string, Box>()
  for (const el of doc.elements) {
    if (!selection.includes(el.id) || el.locked) continue
    const node = content.findOne((n: Konva.Node) => n.id() === el.id)
    if (node) boxes.set(el.id, node.getClientRect({ relativeTo: content, skipShadow: true }))
  }
  if (boxes.size === 0) return

  let frame: Box = { x: 0, y: 0, width: BANNER.width, height: BANNER.height }
  if (boxes.size > 1) {
    const all = [...boxes.values()]
    const x = Math.min(...all.map((b) => b.x))
    const y = Math.min(...all.map((b) => b.y))
    frame = { x, y, width: Math.max(...all.map((b) => b.x + b.width)) - x, height: Math.max(...all.map((b) => b.y + b.height)) - y }
  }

  patchElements([...boxes.keys()], (el) => {
    const box = boxes.get(el.id)!
    switch (mode) {
      case 'left':
        return { x: round(el.x + frame.x - box.x, 1) }
      case 'center':
        return { x: round(el.x + frame.x + frame.width / 2 - (box.x + box.width / 2), 1) }
      case 'right':
        return { x: round(el.x + frame.x + frame.width - (box.x + box.width), 1) }
      case 'top':
        return { y: round(el.y + frame.y - box.y, 1) }
      case 'middle':
        return { y: round(el.y + frame.y + frame.height / 2 - (box.y + box.height / 2), 1) }
      case 'bottom':
        return { y: round(el.y + frame.y + frame.height - (box.y + box.height), 1) }
    }
  })
}
