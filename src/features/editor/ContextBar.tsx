import type { ReactNode } from 'react'
import { Select } from 'radix-ui'
import {
  AlignCenter, AlignEndHorizontal, AlignEndVertical, AlignHorizontalJustifyCenter, AlignLeft, AlignRight,
  AlignStartHorizontal, AlignStartVertical, AlignVerticalJustifyCenter, ArrowDownToLine, ArrowUpToLine, BringToFront,
  CaseUpper, Check, ChevronDown, Copy, Droplet, Italic, Lock, LockOpen, Minus, PaintBucket, Plus, SendToBack, Trash2,
} from 'lucide-react'
import { alignSelection, type AlignMode } from '@/canvas/align'
import { BarButton, ColorButton, Divider, IconButton, Popover, SliderRow } from '@/components/ui'
import { FONT_BY_FAMILY, FONTS, nearestWeight, WEIGHT_NAMES } from '@/lib/fonts'
import type { BannerElement, IconElement, ImageElement, ShapeElement, TextElement } from '@/lib/types'
import { clamp, round } from '@/lib/util'
import { selectedElements, useEditor } from '@/store/editor'
import { toast } from '@/store/toasts'

const GROUPS = ['Sans', 'Display', 'Serif', 'Mono & hand'] as const

function Dropdown({ value, onChange, label, width, children, display }: { value: string; onChange: (value: string) => void; label: string; width: number; children: ReactNode; display?: ReactNode }) {
  return (
    <Select.Root value={value} onValueChange={onChange}>
      <Select.Trigger
        aria-label={label}
        className="inline-flex h-8 shrink-0 items-center justify-between gap-1.5 rounded-lg px-2.5 text-[13px] transition-colors hover:bg-hover data-[state=open]:bg-active"
        style={{ width }}
      >
        <span className="truncate">{display ?? <Select.Value />}</span>
        <ChevronDown className="size-3.5 shrink-0 text-subtle" />
      </Select.Trigger>
      <Select.Portal>
        <Select.Content position="popper" sideOffset={10} className="z-50 max-h-[min(420px,var(--radix-select-content-available-height))] min-w-[var(--radix-select-trigger-width)] animate-pop overflow-hidden rounded-xl bg-pop shadow-pop">
          <Select.Viewport className="p-1.5">{children}</Select.Viewport>
        </Select.Content>
      </Select.Portal>
    </Select.Root>
  )
}

function Option({ value, children, style }: { value: string; children: ReactNode; style?: React.CSSProperties }) {
  return (
    <Select.Item
      value={value}
      style={style}
      className="relative flex h-8 cursor-pointer items-center rounded-md pr-8 pl-2.5 text-[13px] outline-none select-none data-[highlighted]:bg-active"
    >
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
      <input
        aria-label={label}
        type="number"
        value={round(value)}
        onChange={(e) => e.target.value && set(Number(e.target.value))}
        className="h-full w-10 bg-transparent text-center tabular-nums"
      />
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

function TextControls({ el }: { el: TextElement }) {
  const patch = (changes: Partial<TextElement>, key?: string) => useEditor.getState().patchElements([el.id], changes, key && `${key}:${el.id}`)
  const font = FONT_BY_FAMILY.get(el.fontFamily)
  const colors = useDocColors()
  return (
    <>
      <Dropdown
        label="Font"
        width={168}
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
      {font && font.weights.length > 1 && (
        <Dropdown label="Weight" width={112} value={String(el.fontWeight)} onChange={(weight) => patch({ fontWeight: Number(weight) })}>
          {font.weights.map((weight) => (
            <Option key={weight} value={String(weight)} style={{ fontWeight: weight }}>
              {WEIGHT_NAMES[weight] ?? weight}
            </Option>
          ))}
        </Dropdown>
      )}
      <Stepper label="Font size" value={el.fontSize} min={6} max={400} onChange={(fontSize) => patch({ fontSize }, 'size')} />
      <Divider />
      <ColorButton label="Text colour" value={el.fill} extra={colors} onChange={(fill) => fill && patch({ fill }, 'fill')} />
      <IconButton label="Italic" active={el.italic} onClick={() => patch({ italic: !el.italic })}>
        <Italic />
      </IconButton>
      <IconButton label="Uppercase" active={el.uppercase} onClick={() => patch({ uppercase: !el.uppercase })}>
        <CaseUpper />
      </IconButton>
      <div role="radiogroup" aria-label="Text alignment" className="flex">
        {(
          [
            ['left', AlignLeft],
            ['center', AlignCenter],
            ['right', AlignRight],
          ] as const
        ).map(([align, Icon]) => (
          <IconButton key={align} role="radio" aria-checked={el.align === align} label={`Align ${align}`} active={el.align === align} onClick={() => patch({ align })}>
            <Icon />
          </IconButton>
        ))}
      </div>
      <Popover trigger={<BarButton>Spacing</BarButton>} className="w-56 space-y-3">
        <SliderRow label="Letter spacing" value={el.letterSpacing} min={-6} max={24} step={0.5} onChange={(letterSpacing) => patch({ letterSpacing }, 'ls')} />
        <SliderRow label="Line height" value={el.lineHeight} min={0.8} max={2.2} step={0.05} format={(v) => v.toFixed(2)} onChange={(lineHeight) => patch({ lineHeight }, 'lh')} />
      </Popover>
    </>
  )
}

function CornerControl({ el }: { el: ShapeElement | ImageElement }) {
  const max = Math.max(1, Math.round(Math.min(el.width, el.height) / 2))
  return (
    <Popover trigger={<BarButton>Corners</BarButton>} className="w-56">
      <SliderRow label="Corner radius" value={Math.min(el.radius, max)} min={0} max={max} onChange={(radius) => useEditor.getState().patchElements([el.id], { radius }, `radius:${el.id}`)} />
    </Popover>
  )
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
      {el.shape === 'rect' && <CornerControl el={el} />}
    </>
  )
}

function ImageControls({ el }: { el: ImageElement }) {
  return (
    <>
      <CornerControl el={el} />
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
        <PaintBucket /> Set as background
      </BarButton>
    </>
  )
}

function IconControls({ el }: { el: IconElement }) {
  const colors = useDocColors()
  const patch = (changes: Partial<IconElement>, key: string) => useEditor.getState().patchElements([el.id], changes, `${key}:${el.id}`)
  return (
    <ColorButton label="Icon colour" value={el.color} extra={colors} onChange={(color) => color && patch({ color }, 'fill')}>
      <SliderRow label="Line weight" value={el.strokeWidth} min={0.75} max={3} step={0.25} onChange={(strokeWidth) => patch({ strokeWidth }, 'sw')} />
    </ColorButton>
  )
}

const ALIGNS: { mode: AlignMode; label: string; icon: typeof AlignLeft }[] = [
  { mode: 'left', label: 'Left', icon: AlignStartVertical },
  { mode: 'center', label: 'Centre', icon: AlignHorizontalJustifyCenter },
  { mode: 'right', label: 'Right', icon: AlignEndVertical },
  { mode: 'top', label: 'Top', icon: AlignStartHorizontal },
  { mode: 'middle', label: 'Middle', icon: AlignVerticalJustifyCenter },
  { mode: 'bottom', label: 'Bottom', icon: AlignEndHorizontal },
]

function CommonControls({ elements }: { elements: BannerElement[] }) {
  const ids = elements.map((el) => el.id)
  const editor = useEditor.getState()
  const allLocked = elements.every((el) => el.locked)
  const opacity = elements[0].opacity
  const mod = navigator.platform.includes('Mac') ? '⌘' : 'Ctrl+'
  return (
    <>
      <Popover trigger={<BarButton>Position</BarButton>} className="w-60">
        <p className="mb-2 text-xs text-muted">{elements.length > 1 ? 'Align to each other' : 'Align to banner'}</p>
        <div className="grid grid-cols-3 gap-1">
          {ALIGNS.map(({ mode, label, icon: Icon }) => (
            <button key={mode} type="button" onClick={() => alignSelection(mode)} className="flex h-8 items-center gap-2 rounded-md px-2 text-xs text-muted hover:bg-hover hover:text-fg">
              <Icon className="size-3.5" /> {label}
            </button>
          ))}
        </div>
        <p className="mt-3 mb-2 text-xs text-muted">Layer order</p>
        <div className="grid grid-cols-2 gap-1">
          {(
            [
              ['forward', 'Forward', ArrowUpToLine],
              ['backward', 'Backward', ArrowDownToLine],
              ['front', 'To front', BringToFront],
              ['back', 'To back', SendToBack],
            ] as const
          ).map(([to, label, Icon]) => (
            <button key={to} type="button" onClick={() => useEditor.getState().reorder(to)} className="flex h-8 items-center gap-2 rounded-md px-2 text-xs text-muted hover:bg-hover hover:text-fg">
              <Icon className="size-3.5" /> {label}
            </button>
          ))}
        </div>
      </Popover>
      <Popover
        trigger={
          <BarButton aria-label="Opacity">
            <Droplet /> <span className="tabular-nums">{Math.round(opacity * 100)}%</span>
          </BarButton>
        }
        className="w-56"
      >
        <SliderRow label="Opacity" value={Math.round(opacity * 100)} min={0} max={100} format={(v) => `${v}%`} onChange={(v) => editor.patchElements(ids, { opacity: v / 100 }, `opacity:${ids.join()}`)} />
      </Popover>
      <Divider />
      <IconButton label="Duplicate" shortcut={`${mod}D`} onClick={() => editor.duplicateSelected()}>
        <Copy />
      </IconButton>
      <IconButton label={allLocked ? 'Unlock' : 'Lock'} active={allLocked} onClick={() => editor.patchElements(ids, { locked: !allLocked })}>
        {allLocked ? <Lock /> : <LockOpen />}
      </IconButton>
      <IconButton label="Delete" shortcut="Del" onClick={() => editor.removeSelected()} className="hover:text-danger">
        <Trash2 />
      </IconButton>
    </>
  )
}

/** Floating toolbar with the controls for whatever is selected. */
export function ContextBar() {
  const elements = useEditor(selectedElementsShallow)
  if (elements.length === 0) return null
  const single = elements.length === 1 ? elements[0] : null
  return (
    <div
      role="toolbar"
      aria-label="Selection"
      className="absolute top-3 left-1/2 z-10 flex max-w-[calc(100%-24px)] -translate-x-1/2 animate-pop items-center gap-0.5 overflow-x-auto rounded-xl bg-panel/95 p-1 shadow-pop backdrop-blur-md"
    >
      {single?.type === 'text' && <TextControls el={single} />}
      {single?.type === 'shape' && <ShapeControls el={single} />}
      {single?.type === 'image' && <ImageControls el={single} />}
      {single?.type === 'icon' && <IconControls el={single} />}
      {!single && <span className="px-2.5 text-xs text-muted">{elements.length} selected</span>}
      <Divider />
      <CommonControls elements={elements} />
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
