import { useState, type CSSProperties, type ReactNode } from 'react'
import { Camera, MousePointerClick, PenLine, Plus, ScanFace, type LucideIcon } from 'lucide-react'
import { AVATAR, BANNER } from '@/lib/constants'
import { FRAME_BAND, PHOTO_FRAMES, photoFrameLayout } from '@/lib/photoFrame'
import { blankDoc } from '@/lib/templates'
import { enterEditor, useWidth } from './shared'

/**
 * The profile card is laid out in banner pixels (1584 wide) and scaled to fit,
 * like the editor's preview. Below the banner: the photo overhang, then bars
 * where the name, headline and location go.
 */
const CARD_HEIGHT = 690
const BARS = {
  name: { x: 64, y: 536, w: 380, h: 30 },
  headline: { x: 64, y: 590, w: 700, h: 20 },
  location: { x: 64, y: 630, w: 250, h: 16 },
}

type Part = 'banner' | 'photo' | 'name'

/** Short handwritten notes, in quiet grey so the skeleton stays the subject. */
const NOTES: Record<Part, { text: string; icon: LucideIcon }> = {
  banner: { text: 'Click to start blank', icon: MousePointerClick },
  photo: { text: 'What your photo covers', icon: ScanFace },
  name: { text: 'Add your name', icon: PenLine },
}
const NOTE_INK = 'text-[#9a9892]'
const NOTE_INK_ACTIVE = 'text-[#55534e]'

/** A hand-drawn arrow: a loose curve and a two-stroke head. */
function Arrow({ d, head, width, height, style, className }: { d: string; head: string; width: number; height: number; style?: CSSProperties; className?: string }) {
  return (
    <svg aria-hidden width={width} height={height} viewBox={`0 0 ${width} ${height}`} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={`pointer-events-none absolute ${className ?? ''}`} style={style}>
      <path d={d} />
      <path d={head} />
    </svg>
  )
}

function NoteText({ part }: { part: Part }) {
  const { text, icon: Icon } = NOTES[part]
  return (
    <>
      <Icon className="size-[18px] shrink-0" strokeWidth={1.75} />
      {text}
    </>
  )
}

function Note({ part, active, style, align = 'left' }: { part: Part; active: boolean; style: CSSProperties; align?: 'left' | 'right' }) {
  return (
    <p
      className={`pointer-events-none absolute flex items-center gap-2 font-hand text-[24px] leading-none font-medium whitespace-nowrap transition-colors duration-200 ${align === 'right' ? 'flex-row-reverse' : ''} ${active ? NOTE_INK_ACTIVE : NOTE_INK}`}
      style={style}
    >
      <NoteText part={part} />
    </p>
  )
}

/** The small label that appears on whatever part of the skeleton is hovered. */
function Hint({ icon, children }: { icon: ReactNode; children: ReactNode }) {
  return (
    <span className="pointer-events-none flex h-8 translate-y-1 items-center gap-1.5 rounded-lg bg-white px-3 text-xs font-semibold whitespace-nowrap text-fg opacity-0 shadow-pop transition-[opacity,transform] duration-200 group-hover:translate-y-0 group-hover:opacity-100 group-focus-visible:translate-y-0 group-focus-visible:opacity-100">
      {icon}
      {children}
    </span>
  )
}

/** LinkedIn's #OpenToWork band, drawn like the editor's preview frame, filling its (round) parent. */
function OpenToWorkRing() {
  const { text, color } = PHOTO_FRAMES.openToWork
  const frame = photoFrameLayout(100, 100)
  return (
    <svg viewBox="0 0 200 200" aria-hidden className="pointer-events-none absolute inset-0 size-full">
      <defs>
        <linearGradient id="otw-fade" gradientUnits="userSpaceOnUse" x1={frame.fadeStart.x} y1={frame.fadeStart.y} x2={frame.fadeEnd.x} y2={frame.fadeEnd.y}>
          <stop offset="0" stopColor={color} stopOpacity={0} />
          <stop offset="1" stopColor={color} />
        </linearGradient>
        <path id="otw-arc" d={frame.textPath} />
      </defs>
      <circle cx="100" cy="100" r={(101 + frame.innerRadius) / 2} fill="none" stroke="url(#otw-fade)" strokeWidth={101 - frame.innerRadius} />
      <text fill="#FFFFFF" fontFamily={`"${FRAME_BAND.family}"`} fontWeight={FRAME_BAND.weight} fontSize={frame.fontSize} letterSpacing={frame.letterSpacing}>
        <textPath href="#otw-arc" startOffset="50%" textAnchor="middle">
          {text}
        </textPath>
      </text>
    </svg>
  )
}

/**
 * A neutral skeleton of a LinkedIn profile, photo in its #OpenToWork band,
 * with handwritten notes pointing at what you can do. Clicking any part of it opens the editor on a blank banner.
 */
export function AnnotatedProfile() {
  const [ref, width] = useWidth<HTMLDivElement>()
  const [hover, setHover] = useState<Part | null>(null)
  const k = width / BANNER.width
  const a = AVATAR.desktop
  const px = (n: number) => n * k

  const startBlank = (from: HTMLElement | null, editProfile?: 'name' | 'photo') => enterEditor(blankDoc(), { from, editProfile })
  const bind = (part: Part) => ({ onPointerEnter: () => setHover(part), onPointerLeave: () => setHover(null), onFocus: () => setHover(part), onBlur: () => setHover(null) })
  const bar = (b: (typeof BARS)[keyof typeof BARS], tone: string) => <span className={`absolute rounded-full ${tone}`} style={{ left: px(b.x), top: px(b.y), width: px(b.w), height: Math.max(6, px(b.h)) }} />
  const nameBox = { left: px(BARS.name.x - 24), top: px(BARS.name.y - 22), width: px(BARS.headline.w + 48), height: px(BARS.location.y + BARS.location.h - BARS.name.y + 44) }

  const avatarMid = px(a.y + a.d / 2)
  const nameMid = px(BARS.name.y + BARS.name.h / 2)
  const height = px(CARD_HEIGHT)

  return (
    <div className="relative mx-auto w-full max-w-[760px]">
      <div ref={ref} className="relative overflow-hidden rounded-2xl bg-white shadow-[0_0_0_1px_rgb(0_0_0/0.07),0_1px_2px_rgb(0_0_0/0.04),0_24px_48px_-24px_rgb(0_0_0/0.18)]" style={{ height }}>
        {width > 0 && (
          <>
            <button
              type="button"
              {...bind('banner')}
              onClick={(e) => startBlank(e.currentTarget)}
              aria-label="Start with a blank banner"
              className="group absolute inset-x-0 top-0 flex items-center justify-end bg-[#ececeb] pr-[6%] transition-colors duration-200 outline-none hover:bg-[#e6e6e4] focus-visible:bg-[#e6e6e4]"
              style={{ height: px(BANNER.height) }}
            >
              <span aria-hidden className="pointer-events-none absolute inset-2 rounded-[10px] border-2 border-dashed border-black/0 transition-colors duration-200 group-hover:border-black/15 group-focus-visible:border-accent/60" />
              <Hint icon={<Plus className="size-3.5" />}>Start with a blank banner</Hint>
            </button>

            <button
              type="button"
              {...bind('photo')}
              onClick={() => startBlank(null, 'photo')}
              aria-label="Add your photo"
              className="group absolute flex items-center justify-center rounded-full bg-white outline-none focus-visible:ring-2 focus-visible:ring-accent/60"
              data-skeleton-photo
              style={{ left: px(a.x), top: px(a.y), width: px(a.d), height: px(a.d), padding: px(a.ring) }}
            >
              <span className="relative block size-full overflow-hidden rounded-full bg-[#e8e8e7] transition-colors duration-200 group-hover:bg-[#e1e1df]">
                {/* Head and shoulders in the editor placeholder's proportions, so the shoulders clear the band. */}
                <svg viewBox="0 0 200 200" className="absolute inset-0 size-full text-[#cbcbc8]" fill="currentColor" aria-hidden>
                  <circle cx="100" cy="82" r="38" />
                  <circle cx="100" cy="195" r="80" />
                </svg>
                <OpenToWorkRing />
              </span>
              <span className="absolute inset-0 flex items-center justify-center">
                <Hint icon={<Camera className="size-3.5" />}>Add your photo</Hint>
              </span>
            </button>

            {bar(BARS.name, 'bg-black/[0.09]')}
            {bar(BARS.headline, 'bg-black/[0.06]')}
            {bar(BARS.location, 'bg-black/[0.045]')}
            <button
              type="button"
              {...bind('name')}
              onClick={() => startBlank(null, 'name')}
              aria-label="Add your name and headline"
              className="group absolute flex items-center justify-end rounded-xl pr-2 outline-none transition-[box-shadow,background-color] duration-200 hover:bg-black/[0.02] hover:ring-2 hover:ring-black/10 focus-visible:ring-2 focus-visible:ring-accent/60"
              style={nameBox}
            >
              <Hint icon={<PenLine className="size-3.5" />}>Add your name</Hint>
            </button>

          </>
        )}
      </div>

      {/* Handwritten notes around the card on wide screens. */}
      {width > 0 && (
        <div aria-hidden className="max-xl:hidden">
          <Note part="banner" active={hover === 'banner'} style={{ left: 'calc(100% + 44px)', top: 16 }} />
          <Arrow className={hover === 'banner' ? NOTE_INK_ACTIVE : NOTE_INK} width={110} height={70} d="M104 10 C 78 2, 40 8, 14 54" head="M24 48 L14 54 L14 42" style={{ left: width - 64, top: 18 }} />

          <Note part="photo" active={hover === 'photo'} align="right" style={{ right: 'calc(100% + 90px)', top: avatarMid + 28 }} />
          <Arrow className={hover === 'photo' ? NOTE_INK_ACTIVE : NOTE_INK} width={100} height={60} d="M4 52 C 30 56, 62 44, 92 16" head="M80 19 L92 16 L88 27" style={{ left: -82, top: avatarMid - 12 }} />

          <Note part="name" active={hover === 'name'} align="right" style={{ right: 'calc(100% + 74px)', top: nameMid + 2 }} />
          <Arrow className={hover === 'name' ? NOTE_INK_ACTIVE : NOTE_INK} width={90} height={40} d="M4 28 C 24 14, 48 34, 84 18" head="M72 17 L84 18 L77 28" style={{ left: -66, top: nameMid - 14 }} />
        </div>
      )}

      {/* On narrower screens the notes sit under the card instead. */}
      <ul className={`mt-4 flex flex-wrap justify-center gap-x-6 gap-y-2 font-hand text-[21px] leading-none ${NOTE_INK} xl:hidden`}>
        {(['banner', 'photo', 'name'] as const).map((part) => (
          <li key={part} className="flex items-center gap-1.5">
            <NoteText part={part} />
          </li>
        ))}
      </ul>
    </div>
  )
}
