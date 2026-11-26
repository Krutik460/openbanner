import { useEffect, useRef, useState } from 'react'
import { ArrowLeft, ArrowRight, Check, LoaderCircle, Plus, TriangleAlert } from 'lucide-react'
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
function ProfileCard({ doc, profile, width, className }: { doc: Pick<BannerDoc, 'background' | 'elements'>; profile: Profile | null; width: number; className?: string }) {
  const k = width / BANNER.width
  const a = AVATAR.desktop
  return (
    <div className={`overflow-hidden rounded-xl bg-white text-left text-[#191919] ${className ?? ''}`} style={{ width }}>
      <div className="relative">
        <StaticBanner doc={doc} width={width} />
        <div className="absolute rounded-full bg-white" style={{ left: a.x * k, top: a.y * k, padding: a.ring * k }}>
          <Avatar profile={profile} size={(a.d - a.ring * 2) * k} />
        </div>
      </div>
      <div style={{ padding: `${(a.y + a.d - BANNER.height) * k + width * 0.022}px ${a.x * k}px ${width * 0.045}px` }}>
        <div className="truncate font-semibold" style={{ fontSize: Math.max(11, width * 0.034) }}>
          {profile?.name || 'Your Name'}
        </div>
        <div className="mt-0.5 truncate text-black/60" style={{ fontSize: Math.max(9, width * 0.023) }}>
          {profile?.headline || 'Your headline appears here'}
        </div>
      </div>
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
    <div className="mx-auto flex w-full max-w-5xl flex-col items-center px-6 pt-[clamp(40px,9vh,112px)] text-center">
      <p className="animate-rise rounded-full border border-line bg-raised/60 px-3.5 py-1 text-xs text-muted">
        Free <span className="mx-1.5 text-subtle">·</span> No account <span className="mx-1.5 text-subtle">·</span> No watermark
      </p>
      <h1 className="mt-7 animate-rise text-[clamp(40px,7vw,84px)] leading-[0.98] font-semibold tracking-[-0.045em] text-balance [animation-delay:60ms]">
        The banner your profile <span className="font-display font-normal tracking-[-0.02em] text-accent italic">deserves.</span>
      </h1>
      <p className="mt-6 max-w-xl animate-rise text-[17px] leading-relaxed text-pretty text-muted [animation-delay:120ms]">
        A design canvas made for one job: your LinkedIn banner. Paste your profile link and design it right where it will live, with your photo and headline in place.
      </p>

      <form onSubmit={submit} className="mt-9 w-full max-w-xl animate-rise [animation-delay:180ms]" noValidate>
        <div className="flex items-center gap-2 rounded-2xl border border-line-strong bg-raised p-1.5 max-sm:flex-col max-sm:items-stretch shadow-[0_20px_60px_-20px_rgb(0_0_0/0.8)] transition-colors focus-within:border-white/30">
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
            aria-describedby={error ? 'profile-url-error' : undefined}
            className="h-12 min-w-0 flex-1 bg-transparent px-3.5 text-[15px] placeholder:text-subtle"
          />
          <Button type="submit" variant="primary" size="lg" disabled={busy} className="min-w-[152px]">
            {busy ? (
              <>
                <LoaderCircle className="size-4 animate-spin" /> Looking you up
              </>
            ) : (
              <>
                Start designing <ArrowRight className="size-4" />
              </>
            )}
          </Button>
        </div>
        <p id="profile-url-error" role="alert" className="mt-2.5 min-h-5 text-sm text-danger">
          {error}
        </p>
      </form>

      <div className="flex animate-rise flex-wrap items-center justify-center gap-x-5 gap-y-2 text-sm text-muted [animation-delay:240ms]">
        <button type="button" className="underline decoration-line-strong underline-offset-4 transition-colors hover:text-fg" onClick={() => onDone({ name: 'setup', note: null }, existing ?? { name: '', headline: '' })}>
          Continue without a link
        </button>
        <button type="button" className="underline decoration-line-strong underline-offset-4 transition-colors hover:text-fg" onClick={() => onDone({ name: 'setup', note: null }, sample)}>
          Try a sample profile
        </button>
      </div>

      {/* Three real templates, rendered live on profile cards. */}
      <div aria-hidden className="pointer-events-none relative mt-[clamp(48px,8vh,88px)] h-[300px] w-full max-w-4xl animate-rise [animation-delay:320ms] max-sm:hidden">
        <ProfileCard doc={pick('editorial')} profile={sample} width={520} className="absolute top-10 left-0 -rotate-[5deg] opacity-70 shadow-2xl" />
        <ProfileCard doc={pick('sunset')} profile={sample} width={520} className="absolute top-10 right-0 rotate-[5deg] opacity-70 shadow-2xl" />
        <ProfileCard doc={pick('aurora')} profile={sample} width={640} className="absolute top-0 left-1/2 -translate-x-1/2 shadow-[0_40px_100px_-20px_rgb(0_0_0/0.9)]" />
        <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-app to-transparent" />
      </div>
    </div>
  )
}

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
          <h1 className="text-3xl leading-tight font-semibold tracking-tight">
            First, <span className="font-display text-[1.15em] font-normal text-accent italic">you.</span>
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-muted">This fills in the profile preview and personalises every template. It stays in your browser.</p>
          {note && (
            <p className={`mt-5 flex gap-2.5 rounded-xl border px-3.5 py-3 text-sm leading-relaxed ${note.tone === 'ok' ? 'border-accent/25 bg-accent/5' : 'border-line-strong bg-raised'}`}>
              {note.tone === 'ok' ? <Check className="mt-0.5 size-4 shrink-0 text-accent" /> : <TriangleAlert className="mt-0.5 size-4 shrink-0 text-[#f5b700]" />}
              {note.text}
            </p>
          )}
          <div ref={nameRef} className="mt-5 rounded-2xl border border-line bg-panel p-4">
            <ProfileFields profile={profile} onChange={setProfile} />
          </div>
          <p className="mt-3 text-xs text-subtle">Click the photo to add yours. Templates update as you type.</p>
        </div>

        <div className="animate-rise [animation-delay:80ms]">
          <h2 className="text-sm font-medium text-muted">Pick a starting point</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {templates.map(({ template, doc }) => (
              <button
                key={template.id}
                type="button"
                onClick={() => start(instantiate(template, profile))}
                className="group rounded-2xl border border-line bg-panel p-2.5 text-left transition-[transform,border-color,background-color] duration-200 hover:-translate-y-1 hover:border-line-strong hover:bg-raised"
              >
                <TemplateCard doc={doc} profile={profile} />
                <div className="flex items-center justify-between px-1.5 pt-2.5 pb-0.5">
                  <span className="text-sm font-medium">{template.name}</span>
                  <span className="flex items-center gap-1 text-xs text-subtle opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
                    Use this <ArrowRight className="size-3.5" />
                  </span>
                </div>
              </button>
            ))}
            <button
              type="button"
              onClick={() => start(blankDoc())}
              className="flex min-h-40 flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-line-strong text-muted transition-colors hover:bg-raised hover:text-fg"
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
    <div ref={ref} className="min-h-28">
      {width > 0 && <ProfileCard doc={doc} profile={profile} width={width} />}
    </div>
  )
}

export function Welcome() {
  const [step, setStep] = useState<Step>({ name: 'start' })
  const [profile, setProfile] = useState<Profile>({ name: '', headline: '' })
  const hasDesign = useEditor((s) => s.doc.elements.length > 0 || s.past.length > 0)

  return (
    <div className="relative min-h-full overflow-x-hidden">
      {/* Soft glow behind the hero. */}
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-[640px] bg-[radial-gradient(ellipse_60%_55%_at_50%_-10%,rgb(200_242_75/0.13),transparent)]" />
      <header className="relative flex h-16 items-center justify-between px-6">
        <Logo className="text-[15px]" />
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
        Your designs and uploads are stored in this browser, not on a server. Not affiliated with LinkedIn.
      </footer>
    </div>
  )
}
