import { useEffect, useMemo, useRef, useState } from 'react'
import { Search } from 'lucide-react'
import type { Context } from 'konva/lib/Context'
import { traceShape } from '@/canvas/shapes'
import { SectionTitle } from '@/components/ui'
import { ICON_NAMES, ICONS } from '@/lib/icons'
import type { ShapeElement } from '@/lib/types'
import { addIcon, addShape } from '../actions'

type ShapePreset = Partial<ShapeElement> & Pick<ShapeElement, 'shape'> & { label: string }

const SHAPES: ShapePreset[] = [
  { label: 'Rectangle', shape: 'rect', width: 220, height: 150 },
  { label: 'Rounded rectangle', shape: 'rect', width: 220, height: 150, radius: 28 },
  { label: 'Pill', shape: 'rect', width: 220, height: 64, radius: 32 },
  { label: 'Circle', shape: 'ellipse', width: 160, height: 160 },
  { label: 'Triangle', shape: 'triangle', width: 170, height: 150 },
  { label: 'Diamond', shape: 'diamond', width: 160, height: 160 },
  { label: 'Hexagon', shape: 'hexagon', width: 180, height: 156 },
  { label: 'Star', shape: 'star', width: 170, height: 170 },
  { label: 'Arrow', shape: 'arrow', width: 220, height: 90 },
  { label: 'Blob', shape: 'blob', width: 200, height: 180 },
  { label: 'Quarter circle', shape: 'quarter', width: 170, height: 170 },
  { label: 'Arch', shape: 'arch', width: 140, height: 200 },
  { label: 'Line', shape: 'rect', width: 260, height: 4, radius: 2 },
  { label: 'Frame', shape: 'rect', width: 240, height: 160, radius: 16, fill: null },
  { label: 'Ring', shape: 'ellipse', width: 170, height: 170, fill: null },
]

function ShapePreview({ preset }: { preset: ShapePreset }) {
  const ref = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const canvas = ref.current!
    const size = 44
    const dpr = window.devicePixelRatio || 1
    canvas.width = canvas.height = size * dpr
    const ctx = canvas.getContext('2d')!
    ctx.scale(dpr, dpr)
    const { width = 160, height = 160 } = preset
    const scale = Math.min((size - 6) / width, (size - 6) / height)
    const w = width * scale
    const h = Math.max(height * scale, 2)
    ctx.translate((size - w) / 2, (size - h) / 2)
    ctx.beginPath()
    // traceShape only uses path methods the native 2D context shares with Konva's wrapper.
    traceShape(ctx as unknown as Context, preset.shape, w, h, (preset.radius ?? 0) * scale)
    ctx.closePath()
    if (preset.fill === null) {
      ctx.strokeStyle = '#111111'
      ctx.lineWidth = 2
      ctx.stroke()
    } else {
      ctx.fillStyle = '#111111'
      ctx.fill()
    }
  }, [preset])
  return <canvas ref={ref} className="size-11" />
}

export function ElementsPanel({ onAdd }: { onAdd: () => void }) {
  const [query, setQuery] = useState('')
  const icons = useMemo(() => {
    const q = query.trim().toLowerCase()
    return q ? ICON_NAMES.filter((name) => name.toLowerCase().includes(q)) : ICON_NAMES
  }, [query])

  return (
    <div className="space-y-6">
      <section>
        <SectionTitle>Shapes</SectionTitle>
        <div className="grid grid-cols-5 gap-1.5">
          {SHAPES.map(({ label, ...preset }) => (
            <button
              key={label}
              type="button"
              aria-label={label}
              title={label}
              onClick={() => (addShape(preset), onAdd())}
              className="flex aspect-square items-center justify-center rounded-lg transition-colors hover:bg-hover"
            >
              <ShapePreview preset={{ label, ...preset }} />
            </button>
          ))}
        </div>
      </section>

      <section>
        <SectionTitle>Icons</SectionTitle>
        <label className="mb-2.5 flex h-9 items-center gap-2 rounded-lg border border-line bg-app px-2.5 focus-within:border-line-strong">
          <Search className="size-3.5 text-subtle" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search icons" className="w-full bg-transparent placeholder:text-subtle" />
        </label>
        {icons.length === 0 ? (
          <p className="py-6 text-center text-xs text-subtle">No icons match “{query}”.</p>
        ) : (
          <div className="grid grid-cols-6 gap-1">
            {icons.map((name) => {
              const Icon = ICONS[name]
              return (
                <button
                  key={name}
                  type="button"
                  aria-label={name}
                  title={name}
                  onClick={() => (addIcon(name), onAdd())}
                  className="flex aspect-square items-center justify-center rounded-lg text-fg transition-colors hover:bg-hover"
                >
                  <Icon className="size-5" strokeWidth={1.75} />
                </button>
              )
            })}
          </div>
        )}
      </section>
    </div>
  )
}
