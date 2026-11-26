import type { ReactNode } from 'react'
import { ArrowRight, ArrowUpRight, CircleUserRound, CloudOff, Code, Download, EyeOff, LayoutTemplate, Move, Shapes, UserRoundX } from 'lucide-react'
import { AVATAR, BANNER } from '@/lib/constants'
import { isModifiedClick } from '@/lib/route'
import { FONTS } from '@/lib/fonts'
import { instantiate, TEMPLATES, type Template } from '@/lib/templates'
import type { Device } from '@/lib/types'
import { useTemplateDocs } from '../editor/panels/TemplatesPanel'
import { BannerThumb, enterEditor, REPO_URL } from './shared'

/** The templates shown under the hero, picked to show range; the rest live on the templates page. */
const FEATURED = ['glow', 'poster', 'signature', 'midnight']

function openTemplate(template: Template, from: HTMLElement | null) {
  enterEditor(instantiate(template, null), { from })
}

/** One template as a clickable banner with its name underneath. */
/** `hideNameOnPhone` keeps the landing strip short on phones, so the skeleton below it stays in view. */
export function TemplateTile({ template, doc, hideNameOnPhone }: { template: Template; doc: ReturnType<typeof useTemplateDocs>[number]['doc']; hideNameOnPhone?: boolean }) {
  return (
    <button
      type="button"
      onClick={(e) => openTemplate(template, e.currentTarget.querySelector<HTMLElement>('[data-banner]'))}
      className="group block w-full rounded-xl text-left outline-none"
      aria-label={`Start with the ${template.name} template`}
    >
      <span data-banner className="block overflow-hidden rounded-[10px] shadow-[0_0_0_1px_rgb(0_0_0/0.07)] transition-[box-shadow,transform] duration-200 group-hover:-translate-y-0.5 group-hover:shadow-[0_0_0_1px_rgb(0_0_0/0.1),0_12px_24px_-12px_rgb(0_0_0/0.3)] group-focus-visible:shadow-[0_0_0_2px_var(--color-accent)]">
        <BannerThumb doc={doc} />
      </span>
      <span className={`mt-2 flex items-center justify-between text-[13px] font-medium text-muted group-hover:text-fg ${hideNameOnPhone ? 'max-sm:hidden' : ''}`}>
        {template.name}
        <ArrowRight className="size-3.5 -translate-x-1 opacity-0 transition-[opacity,transform] duration-200 group-hover:translate-x-0 group-hover:opacity-100" />
      </span>
    </button>
  )
}

export function TemplateStrip({ onSeeAll }: { onSeeAll: () => void }) {
  const all = useTemplateDocs(null)
  const featured = all.filter(({ template }) => FEATURED.includes(template.id))
  const templates = featured.length === FEATURED.length ? featured : all.slice(0, FEATURED.length)
  return (
    <div className="mx-auto w-full max-w-[760px]">
      <div className="mb-4 flex items-baseline justify-between gap-4">
        <h2 className="text-[15px] font-semibold">Start from a template</h2>
        <a
          href="/templates"
          onClick={(e) => isModifiedClick(e) || (e.preventDefault(), onSeeAll())}
          className="flex items-center gap-1 text-sm font-medium text-muted transition-colors hover:text-fg"
        >
          See all {TEMPLATES.length} templates <ArrowRight className="size-3.5" />
        </a>
      </div>
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-x-4 sm:gap-y-5">
        {templates.map(({ template, doc }) => (
          <li key={template.id}>
            <TemplateTile template={template} doc={doc} hideNameOnPhone />
          </li>
        ))}
      </ul>
    </div>
  )
}

/** Two little profile cards showing where the photo lands on desktop and on mobile. */
function CoverageIllustration() {
  const H = 720
  const card = (device: Device, label: string) => {
    const a = AVATAR[device]
    const pct = (n: number, of: number) => `${(n / of) * 100}%`
    return (
      <figure className="min-w-0 flex-1">
        <div className="relative overflow-hidden rounded-lg bg-white shadow-[0_0_0_1px_rgb(0_0_0/0.07)]" style={{ aspectRatio: `${BANNER.width} / ${H}` }}>
          <div className="absolute inset-x-0 top-0 bg-[repeating-linear-gradient(135deg,#ededec_0_7px,#e5e5e3_7px_14px)]" style={{ height: pct(BANNER.height, H) }} />
          <div
            className="absolute rounded-full bg-white"
            style={{ left: pct(a.x, BANNER.width), top: pct(a.y, H), width: pct(a.d, BANNER.width), aspectRatio: '1', padding: pct(a.ring, BANNER.width) }}
          >
            <div className="size-full rounded-full border-2 border-dashed border-ink-pink/60 bg-tint-pink" />
          </div>
          <span className="absolute rounded-full bg-black/[0.08]" style={{ left: pct(a.x, BANNER.width), top: pct(a.y + a.d + 40, H), width: '24%', height: '5%' }} />
          <span className="absolute rounded-full bg-black/[0.05]" style={{ left: pct(a.x, BANNER.width), top: pct(a.y + a.d + 100, H), width: '40%', height: '4%' }} />
        </div>
        <figcaption className="mt-2 text-center text-xs font-medium text-muted">{label}</figcaption>
      </figure>
    )
  }
  return (
    <div className="flex gap-4">
      {card('desktop', 'Desktop')}
      {card('mobile', 'Mobile')}
    </div>
  )
}

/** A loose fan of real templates. */
function TemplateFan() {
  const docs = useTemplateDocs(null)
  const pick = ['sticker', 'monogram', 'streak'].map((id) => docs.find((d) => d.template.id === id) ?? docs[0])
  const poses = ['left-0 top-0 -rotate-3', 'left-[15%] top-[26%] rotate-2', 'left-[30%] top-[52%] -rotate-1']
  return (
    <div aria-hidden className="relative h-[124px]">
      {pick.map(({ template, doc }, i) => (
        <div key={template.id} className={`absolute w-[70%] overflow-hidden rounded-md shadow-[0_0_0_1px_rgb(0_0_0/0.06),0_8px_16px_-8px_rgb(0_0_0/0.3)] ${poses[i]}`}>
          <BannerThumb doc={doc} />
        </div>
      ))}
    </div>
  )
}

function Tile({ icon, tint, title, children, className, art }: { icon: ReactNode; tint: string; title: string; children: ReactNode; className?: string; art?: ReactNode }) {
  return (
    <div className={`flex flex-col rounded-2xl border border-black/[0.07] bg-white p-6 ${className ?? ''}`}>
      <span className={`flex size-10 items-center justify-center rounded-xl ${tint}`}>{icon}</span>
      <h3 className="mt-5 text-[17px] font-semibold tracking-[-0.01em]">{title}</h3>
      <p className="mt-1.5 text-[15px] leading-relaxed text-pretty text-muted">{children}</p>
      {art && <div className="mt-6">{art}</div>}
    </div>
  )
}

export function Features() {
  return (
    <section aria-labelledby="features-title" className="mx-auto max-w-5xl px-4 pt-28 sm:px-6">
      <div className="mx-auto max-w-2xl text-center">
        <h2 id="features-title" className="text-[clamp(30px,4vw,44px)] leading-[1.1] font-extrabold tracking-[-0.035em] text-balance">
          Everything a banner needs, and nothing it doesn't
        </h2>
        <p className="mt-4 text-lg leading-relaxed text-pretty text-muted">A real design tool that fits in a browser tab. No plugins, no learning curve.</p>
      </div>
      <div className="mt-14 grid gap-4 md:grid-cols-3">
        <Tile
          className="md:col-span-2"
          icon={<CircleUserRound className="size-5 text-ink-pink" />}
          tint="bg-tint-pink"
          title="See what your photo covers"
          art={<CoverageIllustration />}
        >
          You design on a preview of a LinkedIn profile, on desktop and on mobile. If text slips behind your photo, Openbanner tells you.
        </Tile>
        <Tile icon={<LayoutTemplate className="size-5 text-ink-purple" />} tint="bg-tint-purple" title="Start from a template" art={<TemplateFan />}>
          {TEMPLATES.length} starting points with placeholder text that is easy to replace. Or begin with a blank banner.
        </Tile>
        <Tile icon={<Shapes className="size-5 text-ink-blue" />} tint="bg-tint-blue" title="Add anything">
          Text in {FONTS.length} fonts, shapes and icons, your own images, gradients and photo backgrounds.
        </Tile>
        <Tile icon={<Move className="size-5 text-ink-orange" />} tint="bg-tint-orange" title="Edit like a design tool">
          Drag, resize, rotate, snap to guides, select several things at once, undo anything. Keyboard shortcuts included.
        </Tile>
        <Tile icon={<Download className="size-5 text-ink-green" />} tint="bg-tint-green" title="Download in full quality">
          PNG or JPG at 1584 × 396 or twice that, checked against LinkedIn's 8 MB limit. No watermark.
        </Tile>
      </div>
    </section>
  )
}

const PROMISES = [
  { icon: UserRoundX, title: 'No account', body: 'There is nothing to sign up for. Open the page and start.' },
  { icon: CloudOff, title: 'Nothing uploaded', body: 'Designs, photos and details are saved in this browser only, so you can pick up where you left off.' },
  { icon: EyeOff, title: 'No tracking', body: 'No analytics, no cookies, no third-party requests. Even the fonts are bundled.' },
  { icon: Code, title: 'Open source', body: 'MIT licensed. Read the code, host your own copy, or help make it better.' },
]

export function Privacy() {
  return (
    <section aria-labelledby="privacy-title" className="mx-auto max-w-5xl px-4 pt-24 sm:px-6">
      <div className="grid gap-10 rounded-3xl bg-tint-green px-6 py-10 sm:px-10 sm:py-12 md:grid-cols-[1fr_1.15fr] md:gap-12">
        <div>
          <h2 id="privacy-title" className="text-[clamp(28px,3.4vw,40px)] leading-[1.1] font-extrabold tracking-[-0.035em] text-balance">
            Your banner never leaves your browser
          </h2>
          <p className="mt-4 text-[17px] leading-relaxed text-pretty text-[#3f4a3f]">
            Openbanner has no accounts and no server code. Everything you make stays on your device, and every line of the app is public.
          </p>
          <a
            href={REPO_URL}
            target="_blank"
            rel="noreferrer"
            className="mt-7 inline-flex h-10 items-center gap-1.5 rounded-[10px] bg-white px-4 text-sm font-semibold text-fg shadow-[0_0_0_1px_rgb(0_0_0/0.08)] transition-colors hover:bg-white/70"
          >
            Read the code on GitHub <ArrowUpRight className="size-4" />
          </a>
        </div>
        <ul className="grid gap-3 sm:grid-cols-2">
          {PROMISES.map(({ icon: Icon, title, body }) => (
            <li key={title} className="rounded-2xl bg-white p-5 shadow-[0_0_0_1px_rgb(0_0_0/0.05)]">
              <Icon className="size-5 text-ink-green" />
              <h3 className="mt-3 text-[15px] font-semibold">{title}</h3>
              <p className="mt-1 text-sm leading-relaxed text-muted">{body}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
