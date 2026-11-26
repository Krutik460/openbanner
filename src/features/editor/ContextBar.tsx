import { useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import { Select } from 'radix-ui'
import {
  AlignCenter, AlignEndHorizontal, AlignEndVertical, AlignHorizontalJustifyCenter, AlignLeft, AlignRight,
  AlignStartHorizontal, AlignStartVertical, AlignVerticalJustifyCenter, ArrowDownToLine, ArrowUpToLine, Bold,
  BringToFront, CaseUpper, Check, ChevronDown, Copy, Ellipsis, Italic, Minus, PaintBucket, Plus, SendToBack, Trash2,
} from 'lucide-react'
import { alignSelection, type AlignMode } from '@/canvas/align'
import { BarButton, ColorButton, Divider, IconButton, Popover, SliderRow } from '@/components/ui'
import { FONT_BY_FAMILY, FONTS, nearestWeight, WEIGHT_NAMES } from '@/lib/fonts'
import type { BannerElement, IconElement, ImageElement, ShapeElement, TextElement } from '@/lib/types'
import { clamp, round } from '@/lib/util'
import { selectedElements, useEditor } from '@/store/editor'
import { toast } from '@/store/toasts'
import { useView } from '@/store/view'

const GROUPS = ['Sans', 'Display', 'Serif', 'Mono & hand'] as const
const BAR_HEIGHT = 44
const GAP = 10

function Dropdown({ value, onChange, label, width, children, display, bordered }: { value: string; onChange: (value: string) => void; label: string; width: number | string; children: ReactNode; display?: ReactNode; bordered?: boolean }) {
  return (
    <Select.Root value={value} onValueChange={onChange}>
      <Select.Trigger
        aria-label={label}
        className={`inline-flex h-8 items-center justify-between gap-1.5 rounded-lg px-2.5 text-[13px] transition-colors hover:bg-hover data-[state=open]:bg-active ${bordered ? 'min-w-0 flex-1 border border-line' : 'shrink-0'}`}
        style={{ width }}
      >
        <span className="truncate">{display ?? <Select.Value />}</span>
        <ChevronDown className="size-3.5 shrink-0 text-subtle" />
      </Select.Trigger>
      <Select.Portal>
        <Select.Content position="popper" sideOffset={8} className="z-50 max-h-[min(420px,var(--radix-select-content-available-height))] min-w-[var(--radix-select-trigger-width)] animate-pop overflow-hidden rounded-xl bg-pop shadow-pop">
          <Select.Viewport className="p-1.5">{children}</Select.Viewport>
        </Select.Content>
      </Select.Portal>
    </Select.Root>
  )
}

function Option({ value, children, style }: { value: string; children: ReactNode; style?: React.CSSProperties }) {
  return (
    <Select.Item value={value} style={style} className="relative flex h-8 cursor-pointer items-center rounded-md pr-8 pl-2.5 text-[13px] outline-none select-none data-[highlighted]:bg-hover">
      <Select.ItemText>{children}</Select.ItemText>
      <Select.ItemIndicator className="absolute right-2.5">
        <Check className="size-3.5" />
      </Select.ItemIndicator>
    </Select.Item>
  )
}

function Stepper({ value, onChange, label, min, max }: { value: number; onChange: (value: number) => void; label: string; min: number; max: number }) {
  const set = (next: number) => onChange(clamp(round(next), min, max))
  return (
    <div className="flex h-8 shrink-0 items-center rounded-lg border border-line">
      <button type="button" aria-label={`Decrease ${label}`} onClick={() => set(value - (value > 40 ? 4 : 1))} className="flex h-full w-7 items-center justify-center rounded-l-lg text-muted hover:bg-hover hover:text-fg">
        <Minus className="size-3" />
      </button>
      <input aria-label={label} type="number" value={round(value)} onChange={(e) => e.target.value && set(Number(e.target.value))} className="h-full w-9 bg-transparent text-center tabular-nums" />
      <button type="button" aria-label={`Increase ${label}`} onClick={() => set(value + (value >= 40 ? 4 : 1))} className="flex h-full w-7 items-center justify-center rounded-r-lg text-muted hover:bg-hover hover:text-fg">
        <Plus className="size-3" />
      </button>
    </div>
  )
}

function useDocColors(): string[] {
  const elements = useEditor((s) => s.doc.elements)
  const colors = elements.flatMap((el) =>
    el.type === 'text' ? [el.fill] : el.type === 'icon' ? [el.color] : el.type === 'shape' ? [el.fill, el.stroke].filter((c): c is string => typeof c === 'string') : [],
  )
  return [...new Set(colors.filter((c) => c.startsWith('#')))].slice(0, 8)
}

const ALIGNS: { mode: AlignMode; label: string; icon: typeof AlignLeft }[] = [
  { mode: 'left', label: 'Align left', icon: AlignStartVertical },
  { mode: 'center', label: 'Centre horizontally', icon: AlignHorizontalJustifyCenter },
  { mode: 'right', label: 'Align right', icon: AlignEndVertical },
  { mode: 'top', label: 'Align top', icon: AlignStartHorizontal },
  { mode: 'middle', label: 'Centre vertically', icon: AlignVerticalJustifyCenter },
  { mode: 'bottom', label: 'Align bottom', icon: AlignEndHorizontal },
]

const ORDER = [
  ['forward', 'Bring forward', ArrowUpToLine],
  ['backward', 'Send backward', ArrowDownToLine],
  ['front', 'Bring to front', BringToFront],
  ['back', 'Send to back', SendToBack],
] as const

function Label({ children }: { children: ReactNode }) {
  return <p className="mb-1.5 text-xs text-muted">{children}</p>
}

/** Everything that is not needed on every edit lives behind one "more" button. */
function More({ elements, children }: { elements: BannerElement[]; children?: ReactNode }) {
  const ids = elements.map((el) => el.id)
  const opacity = elements[0].opacity
  return (
    <Popover
      className="w-64 space-y-4"
      trigger={
        <IconButton label="More options">
          <Ellipsis />
        </IconButton>
      }
    >
      {children}
      <SliderRow label="Opacity" value={Math.round(opacity * 100)} min={0} max={100} format={(v) => `${v}%`} onChange={(v) => useEditor.getState().patchElements(ids, { opacity: v / 100 }, `opacity:${ids.join()}`)} />
      <div>
        <Label>{elements.length > 1 ? 'Align to each other' : 'Align on banner'}</Label>
        <div className="flex justify-between">
          {ALIGNS.map(({ mode, label, icon: Icon }) => (
            <IconButton key={mode} label={label} onClick={() => alignSelection(mode)}>
              <Icon />
            </IconButton>
          ))}
        </div>
      </div>
      <div>
        <Label>Layer</Label>
        <div className="flex gap-1">
          {ORDER.map(([to, label, Icon]) => (
            <IconButton key={to} label={label} onClick={() => useEditor.getState().reorder(to)}>
              <Icon />
            </IconButton>
          ))}
        </div>
      </div>
      <button type="button" onClick={() => useEditor.getState().duplicateSelected()} className="flex h-8 w-full items-center gap-2 rounded-lg border border-line px-2.5 text-[13px] hover:bg-hover">
        <Copy className="size-3.5" /> Duplicate
      </button>
    </Popover>
  )
}

function TextControls({ el }: { el: TextElement }) {
  const patch = (changes: Partial<TextElement>, key?: string) => useEditor.getState().patchElements([el.id], changes, key && `${key}:${el.id}`)
  const font = FONT_BY_FAMILY.get(el.fontFamily)
  const colors = useDocColors()
  const aligns = { left: AlignLeft, center: AlignCenter, right: AlignRight }
  const AlignIcon = aligns[el.align]
  const canBold = (font?.weights.length ?? 0) > 1
  const bold = el.fontWeight >= 600
  return (
    <>
      <Dropdown
        label="Font"
        width={150}
        value={el.fontFamily}
        display={<span style={{ fontFamily: `"${el.fontFamily}"` }}>{font?.label ?? el.fontFamily}</span>}
        onChange={(family) => patch({ fontFamily: family, fontWeight: nearestWeight(family, el.fontWeight) })}
      >
        {GROUPS.map((group) => (
          <Select.Group key={group}>
            <Select.Label className="px-2.5 pt-2 pb-1 text-[11px] font-medium text-subtle">{group}</Select.Label>
            {FONTS.filter((f) => f.group === group).map((f) => (
              <Option key={f.family} value={f.family} style={{ fontFamily: `"${f.family}"`, fontSize: 15 }}>
                {f.label}
              </Option>
            ))}
          </Select.Group>
        ))}
      </Dropdown>
      <Stepper label="Font size" value={el.fontSize} min={6} max={400} onChange={(fontSize) => patch({ fontSize }, 'size')} />
      <ColorButton label="Text colour" value={el.fill} extra={colors} onChange={(fill) => fill && patch({ fill }, 'fill')} />
      {canBold && (
        <IconButton label="Bold" active={bold} onClick={() => patch({ fontWeight: nearestWeight(el.fontFamily, bold ? 400 : 700) })}>
          <Bold />
        </IconButton>
      )}
      <IconButton label={`Aligned ${el.align} (click to change)`} onClick={() => patch({ align: el.align === 'left' ? 'center' : el.align === 'center' ? 'right' : 'left' })}>
        <AlignIcon />
      </IconButton>
      <More elements={[el]}>
        <div>
          <Label>Style</Label>
          <div className="flex items-center gap-1">
            {font && font.weights.length > 1 && (
              <Dropdown bordered label="Weight" width="auto" value={String(el.fontWeight)} onChange={(weight) => patch({ fontWeight: Number(weight) })}>
                {font.weights.map((weight) => (
                  <Option key={weight} value={String(weight)} style={{ fontWeight: weight }}>
                    {WEIGHT_NAMES[weight] ?? weight}
                  </Option>
                ))}
              </Dropdown>
            )}
            <IconButton label="Italic" active={el.italic} onClick={() => patch({ italic: !el.italic })}>
              <Italic />
            </IconButton>
            <IconButton label="Uppercase" active={el.uppercase} onClick={() => patch({ uppercase: !el.uppercase })}>
              <CaseUpper />
            </IconButton>
          </div>
        </div>
        <SliderRow label="Letter spacing" value={el.letterSpacing} min={-6} max={24} step={0.5} onChange={(letterSpacing) => patch({ letterSpacing }, 'ls')} />
        <SliderRow label="Line height" value={el.lineHeight} min={0.8} max={2.2} step={0.05} format={(v) => v.toFixed(2)} onChange={(lineHeight) => patch({ lineHeight }, 'lh')} />
      </More>
    </>
  )
}

function CornerSlider({ el }: { el: ShapeElement | ImageElement }) {
  const max = Math.max(1, Math.round(Math.min(el.width, el.height) / 2))
  return <SliderRow label="Rounded corners" value={Math.min(el.radius, max)} min={0} max={max} onChange={(radius) => useEditor.getState().patchElements([el.id], { radius }, `radius:${el.id}`)} />
}

function ShapeControls({ el }: { el: ShapeElement }) {
  const patch = (changes: Partial<ShapeElement>, key?: string) => useEditor.getState().patchElements([el.id], changes, key && `${key}:${el.id}`)
  const colors = useDocColors()
  const fill = typeof el.fill === 'string' || el.fill === null ? el.fill : el.fill.stops[0].color
  return (
    <>
      <ColorButton label="Fill" value={fill} allowNone extra={colors} onChange={(next) => patch({ fill: next }, 'fill')} />
      <ColorButton
        label="Outline"
        variant="stroke"
        value={el.stroke}
        allowNone
        extra={colors}
        onChange={(stroke) => patch({ stroke, strokeWidth: stroke && !el.strokeWidth ? 3 : el.strokeWidth }, 'stroke')}
      >
        {el.stroke ? (
          <SliderRow label="Outline width" value={el.strokeWidth} min={0.5} max={24} step={0.5} onChange={(strokeWidth) => patch({ strokeWidth }, 'sw')} />
        ) : (
          <p className="text-xs text-subtle">Pick a colour to add an outline.</p>
        )}
      </ColorButton>
      <More elements={[el]}>{el.shape === 'rect' && <CornerSlider el={el} />}</More>
    </>
  )
}

function ImageControls({ el }: { el: ImageElement }) {
  return (
    <>
      <BarButton
        onClick={() => {
          const editor = useEditor.getState()
          editor.select([])
          editor.mutate((doc) => ({
            ...doc,
            background: { ...doc.background, image: { assetId: el.assetId, opacity: 1 } },
            elements: doc.elements.filter((item) => item.id !== el.id),
          }))
          toast('Photo set as background', { action: { label: 'Undo', run: () => useEditor.getState().undo() } })
        }}
      >
        <PaintBucket /> Use as background
      </BarButton>
      <More elements={[el]}>
        <CornerSlider el={el} />
      </More>
    </>
  )
}

function IconControls({ el }: { el: IconElement }) {
  const colors = useDocColors()
  const patch = (changes: Partial<IconElement>, key: string) => useEditor.getState().patchElements([el.id], changes, `${key}:${el.id}`)
  return (
    <>
      <ColorButton label="Icon colour" value={el.color} extra={colors} onChange={(color) => color && patch({ color }, 'fill')}>
        <SliderRow label="Line weight" value={el.strokeWidth} min={0.75} max={3} step={0.25} onChange={(strokeWidth) => patch({ strokeWidth }, 'sw')} />
      </ColorButton>
      <More elements={[el]} />
    </>
  )
}

/** A small bar that floats just above whatever is selected, with only the controls that thing needs. */
export function ContextBar() {
  const elements = useEditor(selectedElementsShallow)
  const frame = useView((s) => s.frame)
  const viewWidth = useView((s) => s.width)
  const viewHeight = useView((s) => s.height)
  const ref = useRef<HTMLDivElement>(null)
  const [width, setWidth] = useState(0)

  const single = elements.length === 1 ? elements[0] : null
  const visible = elements.length > 0 && frame !== null

  // The bar's width depends on what is selected; measure it so it can be centred and kept on screen.
  useLayoutEffect(() => {
    if (ref.current) setWidth(ref.current.offsetWidth)
  }, [visible, single?.type, single?.id, elements.length])

  if (!visible) return null

  const fitsAbove = frame.y - GAP - BAR_HEIGHT >= 8
  const top = fitsAbove ? frame.y - GAP - BAR_HEIGHT : clamp(frame.y + frame.height + GAP, 8, viewHeight - BAR_HEIGHT - 88)
  const left = clamp(frame.x + frame.width / 2 - width / 2, 8, Math.max(8, viewWidth - width - 8))

  return (
    <div
      ref={ref}
      role="toolbar"
      aria-label="Selection"
      className="absolute z-20 flex items-center gap-0.5 rounded-xl bg-pop p-1.5 shadow-pop"
      style={{ top, left, visibility: width ? 'visible' : 'hidden' }}
    >
      {single?.type === 'text' && <TextControls el={single} />}
      {single?.type === 'shape' && <ShapeControls el={single} />}
      {single?.type === 'image' && <ImageControls el={single} />}
      {single?.type === 'icon' && <IconControls el={single} />}
      {!single && (
        <>
          <span className="px-2 text-xs text-muted">{elements.length} selected</span>
          <More elements={elements} />
        </>
      )}
      <Divider />
      <IconButton label="Delete" shortcut="Del" onClick={() => useEditor.getState().removeSelected()} className="hover:text-danger">
        <Trash2 />
      </IconButton>
    </div>
  )
}

let lastSelected: BannerElement[] = []
/** Selected elements with a stable array identity while nothing about them changes. */
function selectedElementsShallow(state: Parameters<typeof selectedElements>[0]): BannerElement[] {
  const next = selectedElements(state)
  if (next.length === lastSelected.length && next.every((el, i) => el === lastSelected[i])) return lastSelected
  lastSelected = next
  return next
}
