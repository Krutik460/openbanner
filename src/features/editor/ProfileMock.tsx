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
  const unit = desktop ? 1.97 : 4.06

  const frame: CSSProperties = {
    width: BANNER.width,
    transform: `translate(${x}px, ${y}px) scale(${scale})`,
    transformOrigin: '0 0',
  }

  if (!showProfile) {
    return <div aria-hidden className="pointer-events-none absolute top-0 left-0 shadow-[0_30px_80px_-20px_rgb(0_0_0/0.8)]" style={{ ...frame, height: BANNER.height }} />
  }

  const u = (px: number) => `calc(var(--u) * ${px}px)`
  return (
    <div aria-hidden className="pointer-events-none absolute top-0 left-0" style={{ ...frame, ['--u' as string]: unit }}>
      <div
        ref={cardRef}
        className="bg-white text-[#191919] shadow-[0_40px_120px_-30px_rgb(0_0_0/0.9)]"
        style={{ borderRadius: desktop ? 16 : 0, fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif' }}
      >
        <div style={{ height: BANNER.height }} />
        <div style={{ padding: `${avatar.y + avatar.d - BANNER.height + unit * 12}px ${u(desktop ? 24 : 16)} ${u(24)}` }}>
          <div style={{ fontSize: u(24), fontWeight: 600, lineHeight: 1.25 }}>{profile?.name || 'Your Name'}</div>
          <div style={{ fontSize: u(16), lineHeight: 1.4, marginTop: u(2), maxWidth: desktop ? '62%' : '100%' }}>
            {profile?.headline || 'Your headline appears here'}
          </div>
          <div style={{ fontSize: u(14), lineHeight: 1.4, marginTop: u(8), color: 'rgb(0 0 0 / 0.6)' }}>
            {profile?.location || 'Your location'} · <span style={{ color: '#0A66C2', fontWeight: 600 }}>Contact info</span>
          </div>
          <div style={{ fontSize: u(14), marginTop: u(8), color: '#0A66C2', fontWeight: 600 }}>500+ connections</div>
          <div style={{ display: 'flex', gap: u(8), marginTop: u(16) }}>
            {['Open to', 'Add profile section', 'Resources'].map((label, i) => (
              <span
                key={label}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  height: u(32),
                  padding: `0 ${u(16)}`,
                  borderRadius: 999,
                  fontSize: u(16),
                  fontWeight: 600,
                  whiteSpace: 'nowrap',
                  ...(i === 0
                    ? { background: '#0A66C2', color: '#FFFFFF' }
                    : { color: i === 1 ? '#0A66C2' : 'rgb(0 0 0 / 0.6)', boxShadow: `inset 0 0 0 ${u(1)} ${i === 1 ? '#0A66C2' : 'rgb(0 0 0 / 0.6)'}` }),
                }}
              >
                {label}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
