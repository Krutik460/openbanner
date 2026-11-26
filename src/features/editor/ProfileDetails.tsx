import { useEffect, useRef, useState, type CSSProperties } from 'react'
import clsx from 'clsx'
import { Camera } from 'lucide-react'
import { fitView } from '@/canvas/fit'
import { Tooltip } from '@/components/ui'
import { toAvatarDataUrl } from '@/lib/assets'
import { AVATAR, BANNER } from '@/lib/constants'
import { PHOTO_FRAMES, type PhotoFrame } from '@/lib/photoFrame'
import type { Device, Profile } from '@/lib/types'
import { useEditor } from '@/store/editor'
import { rememberProfile } from '@/store/persistence'
import { useView } from '@/store/view'
import { PROFILE_FONT, PROFILE_LINE_ORDER, PROFILE_LINES, type ProfileLine } from './profileLines'

type Box = { x: number; y: number; width: number; height: number }

/** What the visitor clicked on the landing page's skeleton, so the editor can pick up from there. */
type Arrival = 'name' | 'photo'
let arrival: Arrival | null = null
export function requestProfileEdit(what: Arrival): void {
  arrival = what
}

/**
 * The profile preview's text, editable where it sits: the name, headline and
 * location are fields drawn over the card (below the banner, so they never
 * compete with the canvas), shown as skeleton bars while empty. A camera
 * button on the edge of the photo adds or changes the picture. Checkboxes
 * above the banner's top-right corner preview a photo frame (#OpenToWork, #Hiring).
 */
export function ProfileDetails() {
  const lines = useView((s) => s.profileLines)
  const x = useView((s) => s.x)
  const y = useView((s) => s.y)
  const scale = useView((s) => s.scale)
  const device = useEditor((s) => s.device)
  const profile = useEditor((s) => s.profile) ?? { name: '', headline: '' }
  // Read on every render pass but cleared in an effect, so StrictMode's double render cannot lose it.
  const [intent] = useState(() => arrival)
  useEffect(() => {
    arrival = null
  }, [])
  if (!lines) return null

  const place = (box: Box): CSSProperties => ({ left: x + box.x * scale, top: y + box.y * scale, width: box.width * scale, height: box.height * scale })
  return (
    <>
      {PROFILE_LINE_ORDER.map((line) => (
        <LineField
          key={line}
          line={line}
          value={profile[line] ?? ''}
          k={lines.unit * scale}
          style={place(lines.boxes[line])}
          autoFocus={intent === 'name' && line === 'name'}
          onChange={(value) => rememberProfile({ ...profile, [line]: value })}
        />
      ))}
      <PhotoButton device={device} x={x} y={y} scale={scale} profile={profile} attention={intent === 'photo'} />
      <PhotoFrameToggles profile={profile} style={{ left: x + BANNER.width * scale, top: y - 24 }} />
    </>
  )
}

/**
 * Sits opposite the "LinkedIn banner" label, right-aligned to the banner's
 * edge. A photo shows at most one frame, so checking one unchecks the other,
 * and unchecking the checked one leaves none. Preview only: the frame is
 * never part of the downloaded banner.
 */
function PhotoFrameToggles({ profile, style }: { profile: Profile; style: CSSProperties }) {
  return (
    <div className="absolute flex -translate-x-full items-center gap-3" style={style}>
      {(Object.keys(PHOTO_FRAMES) as PhotoFrame[]).map((kind) => {
        const { label, color } = PHOTO_FRAMES[kind]
        const checked = profile.frame === kind
        return (
          <label
            key={kind}
            title={`Preview LinkedIn's ${label} frame on your photo. Not part of the download.`}
            className={clsx('flex cursor-pointer items-center gap-1.5 text-[11px] whitespace-nowrap transition-colors select-none', !checked && 'text-subtle hover:text-fg')}
            style={checked ? { color } : undefined}
          >
            <input
              type="checkbox"
              checked={checked}
              onChange={(e) => rememberProfile({ ...profile, frame: e.target.checked ? kind : undefined })}
              className="size-3 cursor-pointer"
              style={{ accentColor: color }}
            />
            {label}
          </label>
        )
      })}
    </div>
  )
}

/**
 * One line as a borderless text field in the preview's own type. A textarea,
 * so long text wraps exactly like the measured layout underneath; Enter and
 * Escape finish editing instead of adding a line break.
 */
function LineField({ line, value, k, style, autoFocus, onChange }: { line: ProfileLine; value: string; k: number; style: CSSProperties; autoFocus: boolean; onChange: (value: string) => void }) {
  const spec = PROFILE_LINES[line]
  const ref = useRef<HTMLTextAreaElement>(null)
  const [focused, setFocused] = useState(false)
  useEffect(() => {
    if (autoFocus) ref.current?.focus()
  }, [autoFocus])
  const empty = !value.trim()

  return (
    <div className="group absolute" style={style}>
      {empty && !focused && (
        <span
          aria-hidden
          className="pointer-events-none absolute top-1/2 left-0 -translate-y-1/2 rounded-full transition-opacity duration-150 group-hover:opacity-60"
          style={{ width: spec.skeleton * k, height: spec.size * 0.62 * k, background: spec.bar }}
        />
      )}
      <textarea
        ref={ref}
        value={value}
        rows={1}
        spellCheck={false}
        aria-label={spec.label}
        data-profile-line={line}
        title={empty ? `Add your ${spec.label.toLowerCase()}` : undefined}
        placeholder={focused ? spec.placeholder : undefined}
        onChange={(e) => onChange(e.target.value.replace(/\n/g, ' '))}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === 'Escape') {
            e.preventDefault()
            e.currentTarget.blur()
          }
        }}
        onFocus={() => setFocused(true)}
        onBlur={() => {
          setFocused(false)
          if (useView.getState().fitted) fitView()
        }}
        onContextMenu={(e) => e.stopPropagation()}
        className="absolute inset-0 block size-full resize-none overflow-hidden rounded-[3px] bg-transparent p-0 outline-none transition-[background-color,box-shadow] duration-150 placeholder:text-black/30 hover:bg-black/[0.035] hover:shadow-[0_0_0_5px_rgb(0_0_0/0.035)] focus:bg-white focus:shadow-[0_0_0_5px_#fff,0_0_0_7px_var(--color-accent)]"
        style={{ fontFamily: PROFILE_FONT, fontSize: spec.size * k, fontWeight: spec.weight, lineHeight: spec.lineHeight, color: spec.color, whiteSpace: 'pre-wrap', overflowWrap: 'break-word' }}
      />
    </div>
  )
}

/** A small camera button on the lower edge of the photo, the part that hangs below the banner. */
function PhotoButton({ device, x, y, scale, profile, attention }: { device: Device; x: number; y: number; scale: number; profile: Profile; attention: boolean }) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [pulse, setPulse] = useState(attention)
  useEffect(() => {
    if (!pulse) return
    const timer = window.setTimeout(() => setPulse(false), 2600)
    return () => window.clearTimeout(timer)
  }, [pulse])

  const a = AVATAR[device]
  const r = a.d / 2
  // 45 degrees round from the bottom-right of the circle: below the banner on both layouts.
  const cx = x + (a.x + r + r * Math.SQRT1_2) * scale
  const cy = y + (a.y + r + r * Math.SQRT1_2) * scale
  const size = 34
  const label = profile.avatar ? 'Change photo' : 'Add your photo'

  // The camera only shows while the pointer is over the photo (or the button itself, which hangs off its edge).
  // Tracked on the window rather than with a hover box, so the canvas under the photo stays clickable.
  const buttonRef = useRef<HTMLButtonElement>(null)
  const [hovered, setHovered] = useState(false)
  const centerX = x + (a.x + r) * scale
  const centerY = y + (a.y + r) * scale
  const reach = r * scale + size / 2
  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      const host = buttonRef.current?.offsetParent?.getBoundingClientRect()
      if (!host) return
      setHovered(Math.hypot(e.clientX - host.left - centerX, e.clientY - host.top - centerY) <= reach)
    }
    const onOut = (e: PointerEvent) => e.relatedTarget === null && setHovered(false)
    window.addEventListener('pointermove', onMove)
    document.addEventListener('pointerout', onOut)
    return () => {
      window.removeEventListener('pointermove', onMove)
      document.removeEventListener('pointerout', onOut)
    }
  }, [centerX, centerY, reach])
  const visible = hovered || pulse

  const pick = async (file: File | undefined) => {
    if (!file) return
    try {
      rememberProfile({ ...profile, avatar: await toAvatarDataUrl(file) })
    } catch {
      // Not a readable image; keep the current photo.
    }
  }

  return (
    <>
      <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => (void pick(e.target.files?.[0]), (e.target.value = ''))} />
      <Tooltip label={label} side="right">
        <button
          type="button"
          ref={buttonRef}
          aria-label={label}
          onClick={() => (setPulse(false), fileRef.current?.click())}
          onContextMenu={(e) => e.stopPropagation()}
          className={clsx(
            'absolute flex items-center justify-center rounded-full bg-white text-fg shadow-pop transition-[background-color,opacity,transform] duration-150 hover:scale-105 hover:bg-raised focus-visible:pointer-events-auto focus-visible:scale-100 focus-visible:opacity-100 [@media(hover:none)]:pointer-events-auto [@media(hover:none)]:scale-100 [@media(hover:none)]:opacity-100',
            !visible && 'pointer-events-none scale-90 opacity-0',
          )}
          style={{ left: cx - size / 2, top: cy - size / 2, width: size, height: size }}
        >
          {pulse && <span aria-hidden className="absolute inset-0 animate-ping rounded-full ring-2 ring-accent" />}
          <Camera className="size-4" />
        </button>
      </Tooltip>
    </>
  )
}
