import { forwardRef, useEffect, useState, type ButtonHTMLAttributes, type ReactNode } from 'react'
import clsx from 'clsx'
import { Popover as RPopover, Slider as RSlider, Tooltip as RTooltip } from 'radix-ui'
import { HexColorPicker } from 'react-colorful'
import { Ban, Pipette } from 'lucide-react'
import { APP_NAME } from '@/lib/constants'

export function Logo({ className, compact }: { className?: string; compact?: boolean }) {
  return (
    <span className={clsx('inline-flex items-center gap-2 font-bold tracking-tight', className)}>
      <svg viewBox="0 0 28 22" className="h-[18px] w-auto" aria-hidden>
        <rect x="0" y="0" width="28" height="14" rx="4" fill="var(--color-fg)" />
        <circle cx="8.5" cy="14" r="7" fill="var(--color-panel)" />
        <circle cx="8.5" cy="14" r="4.4" fill="var(--color-accent)" />
      </svg>
      <span className={clsx(compact && 'max-sm:hidden')}>{APP_NAME}</span>
    </span>
  )
}

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'secondary', size = 'md', className, type = 'button', ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      className={clsx(
        'inline-flex shrink-0 items-center justify-center gap-1.5 rounded-lg font-medium whitespace-nowrap transition-[background-color,border-color,color,transform] duration-150 select-none active:scale-[0.98] disabled:pointer-events-none disabled:opacity-45',
        size === 'sm' && 'h-7 px-2.5 text-xs',
        size === 'md' && 'h-8 px-3 text-[13px]',
        size === 'lg' && 'h-12 rounded-[10px] px-5 text-[15px] font-semibold',
        variant === 'primary' && 'bg-accent text-accent-ink hover:bg-[#0b5fd0]',
        variant === 'secondary' && 'border border-line-strong bg-panel text-fg hover:bg-raised',
        variant === 'ghost' && 'text-muted hover:bg-hover hover:text-fg',
        className,
      )}
      {...props}
    />
  )
})

export function Tooltip({ label, shortcut, side = 'bottom', children }: { label: string; shortcut?: string; side?: 'top' | 'bottom' | 'left' | 'right'; children: ReactNode }) {
  return (
    <RTooltip.Root>
      <RTooltip.Trigger asChild>{children}</RTooltip.Trigger>
      <RTooltip.Portal>
        <RTooltip.Content
          side={side}
          sideOffset={8}
          className="z-50 flex animate-pop items-center gap-2 rounded-md bg-fg px-2 py-1 text-xs text-white shadow-pop"
        >
          {label}
          {shortcut && <kbd className="font-sans text-[11px] text-white/55">{shortcut}</kbd>}
        </RTooltip.Content>
      </RTooltip.Portal>
    </RTooltip.Root>
  )
}

type IconButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  label: string
  shortcut?: string
  active?: boolean
  tooltipSide?: 'top' | 'bottom' | 'left' | 'right'
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton(
  { label, shortcut, active, tooltipSide, className, children, ...props },
  ref,
) {
  return (
    <Tooltip label={label} shortcut={shortcut} side={tooltipSide}>
      <button
        ref={ref}
        type="button"
        aria-label={label}
        aria-pressed={active}
        className={clsx(
          'inline-flex size-8 shrink-0 items-center justify-center rounded-lg transition-colors duration-150 disabled:pointer-events-none disabled:opacity-35 [&_svg]:size-4',
          active ? 'bg-active text-fg' : 'text-muted hover:bg-hover hover:text-fg',
          className,
        )}
        {...props}
      >
        {children}
      </button>
    </Tooltip>
  )
})

export function Popover({ trigger, children, align = 'center', side = 'bottom', className }: { trigger: ReactNode; children: ReactNode; align?: 'start' | 'center' | 'end'; side?: 'top' | 'bottom' | 'left' | 'right'; className?: string }) {
  return (
    <RPopover.Root>
      <RPopover.Trigger asChild>{trigger}</RPopover.Trigger>
      <RPopover.Portal>
        <RPopover.Content
          align={align}
          side={side}
          sideOffset={10}
          collisionPadding={12}
          className={clsx('z-40 animate-pop rounded-xl bg-pop p-3 shadow-pop outline-none', className)}
        >
          {children}
        </RPopover.Content>
      </RPopover.Portal>
    </RPopover.Root>
  )
}

export function Slider({ value, min, max, step = 1, onChange, label }: { value: number; min: number; max: number; step?: number; onChange: (value: number) => void; label: string }) {
  return (
    <RSlider.Root
      className="relative flex h-5 w-full touch-none items-center select-none"
      value={[value]}
      min={min}
      max={max}
      step={step}
      onValueChange={([v]) => onChange(v)}
      aria-label={label}
    >
      <RSlider.Track className="relative h-1 grow rounded-full bg-active">
        <RSlider.Range className="absolute h-full rounded-full bg-fg" />
      </RSlider.Track>
      <RSlider.Thumb className="block size-3.5 rounded-full bg-fg shadow-[0_1px_3px_rgb(0_0_0/0.3)] transition-transform hover:scale-110" />
    </RSlider.Root>
  )
}

/** A labelled slider row with the current value on the right. */
export function SliderRow({ label, value, format = (v) => String(v), ...slider }: { label: string; value: number; min: number; max: number; step?: number; onChange: (value: number) => void; format?: (value: number) => string }) {
  return (
    <label className="block">
      <span className="mb-1 flex items-center justify-between text-xs">
        <span className="text-muted">{label}</span>
        <span className="text-fg tabular-nums">{format(value)}</span>
      </span>
      <Slider label={label} value={value} {...slider} />
    </label>
  )
}

export function Segmented<T extends string>({ value, options, onChange, label, className }: { value: T; options: { value: T; label: ReactNode; title?: string }[]; onChange: (value: T) => void; label: string; className?: string }) {
  return (
    <div role="radiogroup" aria-label={label} className={clsx('inline-flex rounded-lg bg-raised p-0.5', className)}>
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          role="radio"
          aria-checked={option.value === value}
          aria-label={option.title}
          title={option.title}
          onClick={() => onChange(option.value)}
          className={clsx(
            'inline-flex h-7 flex-1 items-center justify-center gap-1.5 rounded-md px-2.5 text-xs font-medium transition-colors [&_svg]:size-3.5',
            option.value === value ? 'bg-panel text-fg shadow-[0_0_0_1px_rgb(0_0_0/0.06),0_1px_2px_rgb(0_0_0/0.12)]' : 'text-muted hover:text-fg',
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}

const HEX = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i
const SWATCHES = ['#FFFFFF', '#F4F4F5', '#A1A1AA', '#18181B', '#0A0A0B', '#C8F24B', '#34D399', '#22D3EE', '#4C9DFF', '#0A66C2', '#8B5CF6', '#EC4899', '#EF4444', '#F97316', '#F5B700', '#D9B66F']

function toHex(color: string): string {
  if (HEX.test(color)) {
    const hex = color.replace('#', '')
    return `#${hex.length === 3 ? [...hex].map((c) => c + c).join('') : hex}`.toUpperCase()
  }
  // rgba()/named colours from templates: let the browser resolve them.
  const ctx = document.createElement('canvas').getContext('2d')!
  ctx.fillStyle = color
  const resolved = ctx.fillStyle
  return HEX.test(resolved) ? resolved.toUpperCase() : '#FFFFFF'
}

export function ColorPanel({ value, onChange, allowNone, extra }: { value: string | null; onChange: (value: string | null) => void; allowNone?: boolean; extra?: string[] }) {
  const hex = value ? toHex(value) : '#FFFFFF'
  const [draft, setDraft] = useState(hex)
  useEffect(() => setDraft(hex), [hex])
  const swatches = [...new Set([...(extra ?? []).map(toHex), ...SWATCHES])].slice(0, 16)
  return (
    <div className="color-picker w-[216px] space-y-3">
      <HexColorPicker color={hex} onChange={(next) => onChange(next.toUpperCase())} />
      <div className="flex items-center gap-2">
        <div className="flex h-8 min-w-0 flex-1 items-center rounded-lg border border-line bg-app px-2 focus-within:border-line-strong">
          <span className="text-subtle">#</span>
          <input
            aria-label="Hex colour"
            value={draft.replace('#', '')}
            onChange={(e) => {
              const next = e.target.value.trim()
              setDraft(next)
              if (/^#?[0-9a-f]{6}$/i.test(next)) onChange(toHex(next))
            }}
            onBlur={() => setDraft(hex)}
            maxLength={7}
            className="w-full bg-transparent pl-1 font-mono text-xs uppercase"
          />
        </div>
        {'EyeDropper' in window && (
          <Tooltip label="Pick a colour from the screen">
            <button
              type="button"
              aria-label="Pick a colour from the screen"
              onClick={() =>
                new (window as unknown as { EyeDropper: new () => { open: () => Promise<{ sRGBHex: string }> } }).EyeDropper()
                  .open()
                  .then((result) => onChange(toHex(result.sRGBHex)))
                  .catch(() => {})
              }
              className="inline-flex size-8 shrink-0 items-center justify-center rounded-lg border border-line text-muted hover:text-fg"
            >
              <Pipette className="size-4" />
            </button>
          </Tooltip>
        )}
        {allowNone && (
          <Tooltip label="No colour">
            <button
              type="button"
              aria-label="No colour"
              aria-pressed={value === null}
              onClick={() => onChange(null)}
              className={clsx('inline-flex size-8 items-center justify-center rounded-lg border', value === null ? 'border-fg text-fg' : 'border-line text-muted hover:text-fg')}
            >
              <Ban className="size-4" />
            </button>
          </Tooltip>
        )}
      </div>
      <div className="grid grid-cols-8 gap-1.5">
        {swatches.map((swatch) => (
          <button
            key={swatch}
            type="button"
            aria-label={swatch}
            onClick={() => onChange(swatch)}
            className={clsx('aspect-square rounded-md ring-1 ring-black/10 transition-transform hover:scale-110', swatch === hex && value !== null && 'outline-2 outline-offset-1 outline-fg')}
            style={{ background: swatch }}
          />
        ))}
      </div>
    </div>
  )
}

/** A swatch that opens the colour panel. */
export function ColorButton({ value, onChange, label, allowNone, extra, variant = 'fill', children }: { value: string | null; onChange: (value: string | null) => void; label: string; allowNone?: boolean; extra?: string[]; variant?: 'fill' | 'stroke'; children?: ReactNode }) {
  return (
    <Popover
      trigger={
        <IconButton label={label} className="data-[state=open]:bg-active">
          <span
            className="relative block size-[18px] overflow-hidden rounded-full ring-1 ring-black/15"
            style={
              value === null
                ? { background: 'linear-gradient(135deg, transparent 46%, #ff6b6b 46%, #ff6b6b 54%, transparent 54%), #ffffff' }
                : variant === 'stroke'
                  ? { boxShadow: `inset 0 0 0 4px ${value}`, background: 'transparent' }
                  : { background: value }
            }
          />
        </IconButton>
      }
    >
      <p className="mb-2.5 text-xs font-medium text-muted">{label}</p>
      <ColorPanel value={value} onChange={onChange} allowNone={allowNone} extra={extra} />
      {children && <div className="mt-3 w-[216px] border-t border-line pt-3">{children}</div>}
    </Popover>
  )
}

/** A toolbar button with a word on it, for actions an icon alone would not explain. */
export const BarButton = forwardRef<HTMLButtonElement, ButtonHTMLAttributes<HTMLButtonElement>>(function BarButton(
  { className, children, ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      type="button"
      className={clsx(
        'inline-flex h-8 shrink-0 items-center gap-1.5 rounded-lg px-2.5 text-[13px] whitespace-nowrap text-muted transition-colors hover:bg-hover hover:text-fg data-[state=open]:bg-active data-[state=open]:text-fg [&_svg]:size-4',
        className,
      )}
      {...props}
    >
      {children}
    </button>
  )
})

export function Divider({ className }: { className?: string }) {
  return <span aria-hidden className={clsx('mx-1 h-5 w-px shrink-0 bg-line', className)} />
}

export function SectionTitle({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <div className="mb-2 flex h-6 items-center justify-between">
      <h3 className="text-xs font-medium text-muted">{children}</h3>
      {action}
    </div>
  )
}
