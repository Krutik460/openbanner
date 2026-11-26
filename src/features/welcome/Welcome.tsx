import { useEffect, useRef, useState } from 'react'
import { ArrowLeft, ArrowRight, Check, Gift, LoaderCircle, Plus, ShieldCheck, TriangleAlert, UserRoundX } from 'lucide-react'
import { StaticBanner } from '@/canvas/StaticBanner'
import { Button, Logo } from '@/components/ui'
import { AVATAR, BANNER, SAMPLE_PROFILE } from '@/lib/constants'
import { lookupProfile, parseLinkedInHandle, type LookupResult } from '@/lib/linkedin'
import { blankDoc, instantiate } from '@/lib/templates'
import type { BannerDoc, Profile } from '@/lib/types'
import { useEditor } from '@/store/editor'
import { openInEditor, rememberProfile } from '@/store/persistence'
import { Avatar, ProfileFields } from '../editor/ProfileFields'
import { useTemplateDocs } from '../editor/panels/TemplatesPanel'

/** A small profile card with a banner on it: the product's promise in one picture. */
function ProfileCard({ doc, profile, width, className, quiet }: { doc: Pick<BannerDoc, 'background' | 'elements'>; profile: Profile | null; width: number; className?: string; quiet?: boolean }) {
  const k = width / BANNER.width
  const a = AVATAR.desktop
  return (
    <div className={`overflow-hidden rounded-xl bg-white text-left text-[#191919] ring-1 ring-black/10 ${className ?? ''}`} style={{ width }}>
      <div className="relative">
        <StaticBanner doc={doc} width={width} />
        <div className="absolute rounded-full bg-white" style={{ left: a.x * k, top: a.y * k, padding: a.ring * k }}>
          <Avatar profile={profile} size={(a.d - a.ring * 2) * k} />
        </div>
      </div>
      {quiet ? (
        // In a grid of twelve, repeating the name on every card is noise; placeholder lines keep the shape.
        <div className="flex flex-col gap-1.5" style={{ padding: `${(a.y + a.d - BANNER.height) * k + width * 0.03}px ${a.x * k}px ${width * 0.04}px` }}>
          <span className="h-2 w-[28%] rounded-full bg-black/15" />
          <span className="h-1.5 w-[46%] rounded-full bg-black/8" />
        </div>
      ) : (
        <div style={{ padding: `${(a.y + a.d - BANNER.height) * k + width * 0.022}px ${a.x * k}px ${width * 0.045}px` }}>
          <div className="truncate font-semibold" style={{ fontSize: Math.max(11, width * 0.034) }}>
            {profile?.name || 'Your Name'}
          </div>
          <div className="mt-0.5 truncate text-black/60" style={{ fontSize: Math.max(9, width * 0.023) }}>
            {profile?.headline || 'Your headline appears here'}
          </div>
        </div>
      )}
    </div>
  )
}

const FAILURE: Record<Exclude<LookupResult, { ok: true }>['reason'], string> = {
  invalid: 'That doesn’t look like a LinkedIn profile link.',
  not_found: 'LinkedIn has no public profile at that address. Add your details below instead.',
  blocked: 'LinkedIn wouldn’t share that profile with us (it often blocks automated lookups). Add your details below — it takes ten seconds.',
  unreadable: 'We reached LinkedIn but couldn’t read that profile. Add your details below instead.',
  network: 'We couldn’t reach LinkedIn just now. Add your details below instead.',
  unavailable: 'Profile lookup isn’t available here. Add your details below instead.',
}

type Step =
  | { name: 'start' }
  | { name: 'setup'; note: { tone: 'ok' | 'warn'; text: string } | null }

function Start({ onDone }: { onDone: (step: Step, profile: Profile) => void }) {
  const [value, setValue] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const existing = useEditor((s) => s.profile)
  const sample: Profile = SAMPLE_PROFILE
  const templates = useTemplateDocs(sample)
  const pick = (id: string) => templates.find((t) => t.template.id === id)!.doc

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    const handle = parseLinkedInHandle(value)
    if (!handle) {
      setError('Paste your profile link, like linkedin.com/in/your-name')
      return
    }
    setBusy(true)
    setError(null)
    const result = await lookupProfile(handle)
    setBusy(false)
    if (result.ok) {
      onDone({ name: 'setup', note: { tone: 'ok', text: 'Found you. Check the details, then pick a starting point.' } }, { ...result.profile, handle })
    } else {
      onDone({ name: 'setup', note: { tone: 'warn', text: FAILURE[result.reason] } }, { handle, name: '', headline: '' })
    }
  }

  return (
    <>
      <div className="mx-auto flex w-full max-w-4xl flex-col items-center px-6 pt-[clamp(40px,9vh,104px)] text-center">
        <h1 className="animate-rise text-[clamp(38px,6.4vw,72px)] leading-[1.02] font-extrabold tracking-[-0.045em] text-balance">
          The simplest way to make a LinkedIn banner
        </h1>
        <p className="mt-6 max-w-[34rem] animate-rise text-lg leading-relaxed text-pretty text-muted [animation-delay:60ms]">
          Design it on a preview of your own profile. Free, no account, and your work never leaves your browser.
        </p>

        <form onSubmit={submit} className="mt-9 w-full max-w-[34rem] animate-rise [animation-delay:120ms]" noValidate>
          <div className="flex gap-2 max-sm:flex-col">
            <label htmlFor="profile-url" className="sr-only">
              LinkedIn profile link
            </label>
            <input
              id="profile-url"
              value={value}
              onChange={(e) => (setValue(e.target.value), setError(null))}
              placeholder="linkedin.com/in/your-name"
              autoComplete="off"
              autoCapitalize="none"
              spellCheck={false}
              inputMode="url"
              aria-invalid={Boolean(error)}
              aria-describedby={error ? 'profile-url-error' : 'profile-url-note'}
              className="h-12 min-w-0 flex-1 rounded-[10px] border border-line-strong bg-panel px-4 text-[15px] transition-[border-color,box-shadow] placeholder:text-subtle focus:border-accent focus:shadow-[0_0_0_3px_rgb(15_111_236/0.15)]"
            />
            <Button type="submit" variant="primary" size="lg" disabled={busy} className="min-w-[168px]">
              {busy ? (
                <>
                  <LoaderCircle className="size-4 animate-spin" /> Looking you up
                </>
              ) : (
                <>
                  Create my banner <ArrowRight className="size-4" />
                </>
              )}
            </Button>
          </div>
          {error ? (
            <p id="profile-url-error" role="alert" className="mt-3 text-sm text-danger">
              {error}
            </p>
          ) : (
            <p id="profile-url-note" className="mt-3 text-sm text-subtle">
              No signup required. Your link is used once and never stored.
            </p>
          )}
        </form>

        <p className="mt-3 animate-rise text-sm text-muted [animation-delay:180ms]">
          <button type="button" className="font-medium text-fg underline decoration-line-strong underline-offset-4 hover:decoration-fg" onClick={() => onDone({ name: 'setup', note: null }, existing ?? { name: '', headline: '' })}>
            Start without a link
          </button>
          <span className="mx-2 text-subtle">or</span>
          <button type="button" className="font-medium text-fg underline decoration-line-strong underline-offset-4 hover:decoration-fg" onClick={() => onDone({ name: 'setup', note: null }, sample)}>
            try a sample profile
          </button>
        </p>

        {/* One real template on a profile card: the whole idea in a picture. */}
        <div aria-hidden className="pointer-events-none mt-[clamp(40px,7vh,72px)] w-full animate-rise [animation-delay:240ms] max-sm:hidden">
          <ProfileCard doc={pick('aurora')} profile={sample} width={832} className="mx-auto shadow-[0_24px_60px_-28px_rgb(0_0_0/0.3)]" />
        </div>
      </div>

      <section aria-label="Why Openbanner" className="mx-auto w-full max-w-4xl px-6 pt-20 pb-6">
        <div className="grid gap-x-10 gap-y-10 md:grid-cols-3">
          {PROMISES.map(({ icon: Icon, title, body }) => (
            <div key={title}>
              <Icon className="size-6" strokeWidth={1.75} />
              <h2 className="mt-4 text-[17px] font-bold tracking-tight">{title}</h2>
              <p className="mt-1.5 text-[15px] leading-relaxed text-muted">{body}</p>
            </div>
          ))}
        </div>
        <p className="mt-12 border-t border-line pt-6 text-sm leading-relaxed text-subtle">
          The one thing that touches a server: if you paste your profile link, we read your public LinkedIn page once to fill in your name, headline and photo. Nothing is saved, and you can skip it.
        </p>
      </section>
    </>
  )
}

const PROMISES = [
  {
    icon: Gift,
    title: 'Free, with no catch',
    body: 'No paid plan, no watermark, no export limit. Every template, font and tool is included.',
  },
  {
    icon: UserRoundX,
    title: 'No account needed',
    body: 'There is nothing to sign up for. Open the page and start. Come back later and your work is still here.',
  },
  {
    icon: ShieldCheck,
    title: 'Private by design',
    body: 'Your designs, photos and uploads are stored in your browser, not on our servers. No analytics, no cookies, no tracking.',
  },
]

function Setup({ note, initial, onBack }: { note: Extract<Step, { name: 'setup' }>['note']; initial: Profile; onBack: () => void }) {
  const [profile, setProfile] = useState(initial)
  const templates = useTemplateDocs(profile)
  const nameRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Nothing found: put the cursor straight into the name field.
    if (!initial.name) nameRef.current?.querySelector('input')?.focus()
  }, [initial.name])

  const start = (doc: BannerDoc) => {
    rememberProfile({ ...profile, name: profile.name.trim(), headline: profile.headline.trim() })
    openInEditor(doc)
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-6 pt-8 pb-16">
      <button type="button" onClick={onBack} className="mb-8 flex items-center gap-1.5 text-sm text-muted transition-colors hover:text-fg">
        <ArrowLeft className="size-4" /> Back
      </button>
      <div className="grid gap-10 lg:grid-cols-[340px_1fr]">
        <div className="animate-rise lg:sticky lg:top-8 lg:self-start">
          <h1 className="text-3xl leading-tight font-extrabold tracking-[-0.03em]">First, a bit about you</h1>
          <p className="mt-2 text-sm leading-relaxed text-muted">This fills in the profile preview and personalises every template. It is saved in your browser only.</p>
          {note && (
            <p className={`mt-5 flex gap-2.5 rounded-xl border px-3.5 py-3 text-sm leading-relaxed ${note.tone === 'ok' ? 'border-accent/25 bg-accent/5' : 'border-[#e0a800]/40 bg-[#fff8e1]'}`}>
              {note.tone === 'ok' ? <Check className="mt-0.5 size-4 shrink-0 text-accent" /> : <TriangleAlert className="mt-0.5 size-4 shrink-0 text-[#a77b00]" />}
              {note.text}
            </p>
          )}
          <div ref={nameRef} className="mt-6">
            <ProfileFields profile={profile} onChange={setProfile} />
          </div>
          <p className="mt-3 text-xs text-subtle">Click the photo to change it. The templates update as you type.</p>
        </div>

        <div className="animate-rise [animation-delay:80ms]">
          <h2 className="text-sm font-semibold">Pick a starting point</h2>
          <div className="mt-4 grid gap-x-6 gap-y-7 sm:grid-cols-2">
            {templates.map(({ template, doc }) => (
              <button
                key={template.id}
                type="button"
                onClick={() => start(instantiate(template, profile))}
                className="group text-left"
              >
                <TemplateCard doc={doc} profile={profile} />
                <div className="flex items-center justify-between pt-2">
                  <span className="text-sm font-medium">{template.name}</span>
                  <span className="flex items-center gap-1 text-xs font-medium text-accent opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
                    Use this <ArrowRight className="size-3.5" />
                  </span>
                </div>
              </button>
            ))}
            <button
              type="button"
              onClick={() => start(blankDoc())}
              className="flex min-h-36 flex-col items-center justify-center gap-2 self-start rounded-xl border border-dashed border-line-strong text-muted transition-colors hover:border-accent hover:text-accent"
            >
              <Plus className="size-5" />
              <span className="text-sm font-medium">Blank canvas</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

/** Sizes the preview card to its grid cell. */
function TemplateCard({ doc, profile }: { doc: BannerDoc; profile: Profile }) {
  const ref = useRef<HTMLDivElement>(null)
  const [width, setWidth] = useState(0)
  useEffect(() => {
    const el = ref.current!
    const observer = new ResizeObserver(() => setWidth(Math.floor(el.clientWidth)))
    observer.observe(el)
    return () => observer.disconnect()
  }, [])
  return (
    <div ref={ref} className="min-h-24">
      {width > 0 && <ProfileCard quiet doc={doc} profile={profile} width={width} className="transition-shadow group-hover:ring-2 group-hover:ring-accent" />}
    </div>
  )
}

export function Welcome() {
  const [step, setStep] = useState<Step>({ name: 'start' })
  const [profile, setProfile] = useState<Profile>({ name: '', headline: '' })
  const hasDesign = useEditor((s) => s.doc.elements.length > 0 || s.past.length > 0)

  return (
    <div className="relative min-h-full overflow-x-hidden">
      <header className="relative flex h-16 items-center justify-between px-6">
        <Logo className="text-base" />
        {hasDesign && (
          <Button variant="ghost" onClick={() => useEditor.getState().setScreen('editor')}>
            Back to my design <ArrowRight className="size-3.5" />
          </Button>
        )}
      </header>
      <main className="relative">
        {step.name === 'start' ? (
          <Start onDone={(next, found) => (setProfile(found), setStep(next))} />
        ) : (
          <Setup note={step.note} initial={profile} onBack={() => setStep({ name: 'start' })} />
        )}
      </main>
      <footer className="relative px-6 py-8 text-center text-xs text-subtle">
        Openbanner is free and open. Not affiliated with LinkedIn.
      </footer>
    </div>
  )
}
