import { useLayoutEffect, useRef, type CSSProperties } from 'react'
import { fitView } from '@/canvas/fit'
import { AVATAR, BANNER } from '@/lib/constants'
import { useEditor } from '@/store/editor'
import { useView } from '@/store/view'
import { PROFILE_FONT, PROFILE_LINE_ORDER, PROFILE_LINES, type ProfileLine } from './profileLines'

/** LinkedIn CSS pixels to banner pixels, for the current layout's `--u`. */
const u = (px: number) => `calc(var(--u) * ${px}px)`

/**
 * A stand-in for the LinkedIn profile card, drawn underneath the canvas so the
 * banner is seen in context. Laid out in banner pixels and scaled with the view;
 * `--u` converts LinkedIn's CSS pixels into banner pixels for each layout.
 *
 * The name, headline and location are only laid out here, invisibly: their
 * boxes are measured so `ProfileDetails` can draw them above the canvas as
 * fields you type into, with skeleton bars while they are empty. The banner
 * and avatar boxes carry view transition names so the landing card can fly
 * into place here.
 */
export function ProfileMock() {
  const { x, y, scale } = useView()
  const profile = useEditor((s) => s.profile)
  const device = useEditor((s) => s.device)
  const showProfile = useEditor((s) => s.showProfile)
  const cardRef = useRef<HTMLDivElement>(null)
  const lineRefs = useRef<Partial<Record<ProfileLine, HTMLDivElement | null>>>({})
  const avatar = AVATAR[device]
  const desktop = device === 'desktop'

  // Mobile text is really ~4x; it is toned down here so the preview stays readable while editing.
  const unit = desktop ? 1.97 : 2.9

  // Report the card's real height so "fit to screen" can frame the whole preview,
  // and where each text line sits so it can be edited in place.
  useLayoutEffect(() => {
    const card = cardRef.current
    const lines = PROFILE_LINE_ORDER.map((line) => lineRefs.current[line])
    if (!card || lines.some((el) => !el)) {
      useView.getState().set({ profileLines: null })
      return
    }
    const report = () => {
      const view = useView.getState()
      const boxes = Object.fromEntries(
        PROFILE_LINE_ORDER.map((line, i) => {
          const el = lines[i]!
          return [line, { x: el.offsetLeft, y: el.offsetTop, width: el.offsetWidth, height: el.offsetHeight }]
        }),
      ) as Record<ProfileLine, { x: number; y: number; width: number; height: number }>
      const old = view.profileLines
      const same = old && old.unit === unit && PROFILE_LINE_ORDER.every((line) => JSON.stringify(old.boxes[line]) === JSON.stringify(boxes[line]))
      if (!same) view.set({ profileLines: { unit, boxes } })
      if (view.cardHeight === card.offsetHeight) return
      view.set({ cardHeight: card.offsetHeight })
      // While someone types into a line, re-fitting would move the field under their cursor; it re-fits on blur instead.
      if (view.fitted && !(document.activeElement instanceof HTMLTextAreaElement && document.activeElement.dataset.profileLine)) fitView()
    }
    report()
    const observer = new ResizeObserver(report)
    observer.observe(card)
    lines.forEach((el) => observer.observe(el!))
    return () => {
      observer.disconnect()
      useView.getState().set({ profileLines: null })
    }
  }, [showProfile, device, unit])

  const frame: CSSProperties = {
    width: BANNER.width,
    transform: `translate(${x}px, ${y}px) scale(${scale})`,
    transformOrigin: '0 0',
  }

  if (!showProfile) {
    return <div aria-hidden className="pointer-events-none absolute top-0 left-0 shadow-[0_24px_60px_-20px_rgb(0_0_0/0.35)]" style={{ ...frame, height: BANNER.height, viewTransitionName: 'banner' }} />
  }

  const bar = (width: number): CSSProperties => ({ height: u(32), width: u(width), borderRadius: 999, background: 'rgb(0 0 0 / 0.07)' })
  return (
    <div aria-hidden className="pointer-events-none absolute top-0 left-0" style={{ ...frame, ['--u' as string]: unit }}>
      <div
        ref={cardRef}
        className="relative bg-white text-[#191919]"
        style={{
          borderRadius: desktop ? 16 : 0,
          // A hairline instead of a shadow: a shadow would smear through the faded edge below.
          boxShadow: 'inset 0 0 0 2px rgb(0 0 0 / 0.06)',
          fontFamily: PROFILE_FONT,
          // The card is context, not content: let it dissolve instead of ending in a hard white block.
          maskImage: 'linear-gradient(to bottom, #000 calc(100% - 150px), transparent)',
        }}
      >
        <div style={{ height: BANNER.height, viewTransitionName: 'banner' }} />
        <div className="absolute" style={{ left: avatar.x, top: avatar.y, width: avatar.d, height: avatar.d, viewTransitionName: 'avatar' }} />
        <div style={{ padding: `${avatar.y + avatar.d - BANNER.height + unit * 12}px ${u(desktop ? 24 : 16)} ${u(20)}` }}>
          <div style={{ maxWidth: desktop ? '62%' : '100%' }}>
            {PROFILE_LINE_ORDER.map((line) => (
              <Line key={line} ref={(el) => void (lineRefs.current[line] = el)} line={line} text={profile?.[line]} style={{ marginTop: { name: 0, headline: u(2), location: u(8) }[line] }} />
            ))}
          </div>
          {/* Stand-ins for LinkedIn's buttons: enough to read as a profile, quiet enough to ignore. */}
          <div style={{ display: 'flex', gap: u(8), marginTop: u(18), paddingBottom: u(40) }}>
            <span style={bar(92)} />
            <span style={bar(164)} />
            <span style={bar(72)} />
          </div>
        </div>
      </div>
    </div>
  )
}

/**
 * The invisible layout box for one line: the text itself when there is some
 * (so long headlines wrap exactly as they will in the field drawn on top), or
 * one line's height when it is empty.
 */
function Line({ ref, line, text, style }: { ref: (el: HTMLDivElement | null) => void; line: ProfileLine; text?: string; style?: CSSProperties }) {
  const spec = PROFILE_LINES[line]
  const box: CSSProperties = { visibility: 'hidden', fontSize: u(spec.size), fontWeight: spec.weight, lineHeight: spec.lineHeight, whiteSpace: 'pre-wrap', overflowWrap: 'break-word', ...style }
  if (text?.trim()) return <div ref={ref} style={box}>{text}</div>
  return <div ref={ref} style={{ ...box, height: u(spec.size * spec.lineHeight) }} />
}
