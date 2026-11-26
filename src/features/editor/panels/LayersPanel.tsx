import { useState } from 'react'
import clsx from 'clsx'
import { Eye, EyeOff, Image as ImageIcon, Lock, LockOpen, PaintBucket, Shapes, Smile, Type } from 'lucide-react'
import type { BannerElement } from '@/lib/types'
import { useEditor } from '@/store/editor'

const SHAPE_NAMES: Record<string, string> = {
  rect: 'Rectangle', ellipse: 'Ellipse', triangle: 'Triangle', diamond: 'Diamond', hexagon: 'Hexagon',
  star: 'Star', arrow: 'Arrow', blob: 'Blob', quarter: 'Quarter circle', arch: 'Arch',
}

export function layerLabel(el: BannerElement): string {
  if (el.type === 'text') return el.text.replace(/\s+/g, ' ').trim() || 'Empty text'
  if (el.name) return el.name
  if (el.type === 'shape') return SHAPE_NAMES[el.shape]
  if (el.type === 'icon') return `${el.icon} icon`
  return 'Image'
}

const TYPE_ICON = { text: Type, shape: Shapes, image: ImageIcon, icon: Smile }

export function LayersPanel() {
  const elements = useEditor((s) => s.doc.elements)
  const selection = useEditor((s) => s.selection)
  const [dragId, setDragId] = useState<string | null>(null)
  const [drop, setDrop] = useState<{ id: string; after: boolean } | null>(null)

  // The list shows the top layer first; the document stores the bottom layer first.
  const rows = [...elements].reverse()

  const finishDrop = () => {
    if (dragId && drop && dragId !== drop.id) {
      const without = elements.filter((el) => el.id !== dragId)
      const target = without.findIndex((el) => el.id === drop.id)
      // "after" in the list means underneath, i.e. an earlier index in the document.
      useEditor.getState().moveLayer(dragId, drop.after ? target : target + 1)
    }
    setDragId(null)
    setDrop(null)
  }

  return (
    <div className="space-y-3">
      {rows.length === 0 && <p className="rounded-lg border border-dashed border-line-strong px-3 py-6 text-center text-xs text-subtle">Nothing on the banner yet. Add text or elements and they will show up here.</p>}
      <ul className="space-y-0.5" onDragOver={(e) => e.preventDefault()} onDrop={finishDrop}>
        {rows.map((el) => {
          const Icon = TYPE_ICON[el.type]
          const selected = selection.includes(el.id)
          return (
            <li
              key={el.id}
              draggable
              onDragStart={(e) => {
                e.dataTransfer.effectAllowed = 'move'
                setDragId(el.id)
              }}
              onDragOver={(e) => {
                e.preventDefault()
                const rect = e.currentTarget.getBoundingClientRect()
                setDrop({ id: el.id, after: e.clientY > rect.top + rect.height / 2 })
              }}
              onDragEnd={finishDrop}
              className={clsx(
                'group relative flex h-9 items-center gap-2 rounded-lg pr-1 pl-2.5 transition-colors',
                selected ? 'bg-active' : 'hover:bg-hover',
                dragId === el.id && 'opacity-40',
                el.hidden && 'text-subtle',
              )}
            >
              {drop?.id === el.id && dragId !== el.id && (
                <span className={clsx('pointer-events-none absolute right-0 left-0 h-0.5 rounded bg-select', drop.after ? '-bottom-px' : '-top-px')} />
              )}
              <Icon className="size-3.5 shrink-0 text-subtle" />
              <button
                type="button"
                className="min-w-0 flex-1 truncate text-left"
                onClick={(e) => (e.shiftKey ? useEditor.getState().toggleSelect(el.id) : useEditor.getState().select([el.id]))}
              >
                {layerLabel(el)}
              </button>
              <button
                type="button"
                aria-label={el.locked ? 'Unlock layer' : 'Lock layer'}
                onClick={() => useEditor.getState().patchElements([el.id], { locked: !el.locked })}
                className={clsx('flex size-7 items-center justify-center rounded-md hover:bg-app hover:text-fg', el.locked ? 'text-fg' : 'text-subtle opacity-0 group-focus-within:opacity-100 group-hover:opacity-100')}
              >
                {el.locked ? <Lock className="size-3.5" /> : <LockOpen className="size-3.5" />}
              </button>
              <button
                type="button"
                aria-label={el.hidden ? 'Show layer' : 'Hide layer'}
                onClick={() => useEditor.getState().patchElements([el.id], { hidden: !el.hidden })}
                className={clsx('flex size-7 items-center justify-center rounded-md hover:bg-app hover:text-fg', el.hidden ? 'text-fg' : 'text-subtle opacity-0 group-focus-within:opacity-100 group-hover:opacity-100')}
              >
                {el.hidden ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
              </button>
            </li>
          )
        })}
      </ul>
      <button
        type="button"
        onClick={() => useEditor.getState().setPanel('background')}
        className="flex h-9 w-full items-center gap-2 rounded-lg border-t border-line pt-px pl-2.5 text-left text-muted hover:text-fg"
      >
        <PaintBucket className="size-3.5 text-subtle" /> Background
      </button>
      <p className="text-xs text-subtle">Drag to reorder. Locked layers can’t be selected on the canvas, so they are safe to click through.</p>
    </div>
  )
}
