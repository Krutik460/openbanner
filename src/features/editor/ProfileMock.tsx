import { useLayoutEffect, useRef, type CSSProperties } from 'react'
import { fitView } from '@/canvas/fit'
import { AVATAR, BANNER } from '@/lib/constants'
import { useEditor } from '@/store/editor'
import { useView } from '@/store/view'

/**
 * A stand-in for the LinkedIn profile card, drawn underneath the canvas so the
 * banner is seen in context. Laid out in banner pixels and scaled with the view;
 * `--u` converts LinkedIn's CSS pixels into banner pixels for each layout.
 */
export function ProfileMock() {
  const { x, y, scale } = useView()
  const profile = useEditor((s) => s.profile)
  const device = useEditor((s) => s.device)
  const showProfile = useEditor((s) => s.showProfile)
  const cardRef = useRef<HTMLDivElement>(null)
  const avatar = AVATAR[device]
  const desktop = device === 'desktop'

  // Report the card's real height so "fit to screen" can frame the whole preview.
  useLayoutEffect(() => {
    const card = cardRef.current
    if (!card) return
    const report = () => {
      const view = useView.getState()
      if (view.cardHeight === card.offsetHeight) return
      view.set({ cardHeight: card.offsetHeight })
      if (view.fitted) fitView()
    }
    report()
    const observer = new ResizeObserver(report)
    observer.observe(card)
    return () => observer.disconnect()
  }, [showProfile, device])
  // Mobile text is really ~4x; it is toned down here so the preview stays readable while editing.
  const unit = desktop ? 1.97 : 2.9

  const frame: CSSProperties = {
    width: BANNER.width,
    transform: `translate(${x}px, ${y}px) scale(${scale})`,
    transformOrigin: '0 0',
  }

  if (!showProfile) {
    return <div aria-hidden className="pointer-events-none absolute top-0 left-0 shadow-[0_24px_60px_-20px_rgb(0_0_0/0.35)]" style={{ ...frame, height: BANNER.height }} />
  }

  const u = (px: number) => `calc(var(--u) * ${px}px)`
  const bar = (width: number): CSSProperties => ({ height: u(32), width: u(width), borderRadius: 999, background: 'rgb(0 0 0 / 0.07)' })
  return (
    <div aria-hidden className="pointer-events-none absolute top-0 left-0" style={{ ...frame, ['--u' as string]: unit }}>
      <div
        ref={cardRef}
        className="bg-white text-[#191919]"
        style={{
          borderRadius: desktop ? 16 : 0,
          // A hairline instead of a shadow: a shadow would smear through the faded edge below.
          boxShadow: 'inset 0 0 0 2px rgb(0 0 0 / 0.06)',
          fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
          // The card is context, not content: let it dissolve instead of ending in a hard white block.
          maskImage: 'linear-gradient(to bottom, #000 calc(100% - 150px), transparent)',
        }}
      >
        <div style={{ height: BANNER.height }} />
        <div style={{ padding: `${avatar.y + avatar.d - BANNER.height + unit * 12}px ${u(desktop ? 24 : 16)} ${u(20)}` }}>
          <div style={{ fontSize: u(24), fontWeight: 600, lineHeight: 1.25 }}>{profile?.name || 'Your Name'}</div>
          <div style={{ fontSize: u(16), lineHeight: 1.4, marginTop: u(2), maxWidth: desktop ? '62%' : '100%', color: 'rgb(0 0 0 / 0.82)' }}>
            {profile?.headline || 'Your headline appears here'}
          </div>
          <div style={{ fontSize: u(14), lineHeight: 1.4, marginTop: u(8), color: 'rgb(0 0 0 / 0.5)' }}>{profile?.location || 'Your location'}</div>
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
