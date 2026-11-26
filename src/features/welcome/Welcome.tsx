import { useEffect, useRef, useState, type MouseEvent, type RefObject } from 'react'
import { ArrowLeft, ArrowRight, ArrowUpRight, Plus } from 'lucide-react'
import { Logo } from '@/components/ui'
import { isModifiedClick, navigate, routeOf } from '@/lib/route'
import { blankDoc } from '@/lib/templates'
import { useEditor } from '@/store/editor'
import { resumeEditing } from '@/store/persistence'
import { useTemplateDocs } from '../editor/panels/TemplatesPanel'
import { AnnotatedProfile } from './AnnotatedProfile'
import { Features, Privacy, TemplateStrip, TemplateTile } from './Sections'
import { enterEditor, REPO_URL } from './shared'

type Page = 'home' | 'templates'

const TITLES: Record<Page, string> = { home: 'Openbanner - free LinkedIn banner maker', templates: 'Templates - Openbanner' }
const pageOf = (): Page => (routeOf() === 'templates' ? 'templates' : 'home')

/**
 * The landing page and the templates page, switched with the History API so
 * Back works. `scroller` is the page's own scroll container, reset on each switch.
 */
function usePage(scroller: RefObject<HTMLDivElement | null>) {
  const [page, setPage] = useState<Page>(pageOf)
  useEffect(() => {
    const onPop = () => setPage(pageOf())
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [])
  useEffect(() => {
    document.title = TITLES[page]
    scroller.current?.scrollTo({ top: 0 })
  }, [page, scroller])
  const go = (next: Page) => {
    navigate(next)
    setPage(next)
  }
  return [page, go] as const
}

/** An in-app link: a plain click switches page, a modified click keeps the browser's behaviour (new tab and so on). */
const spa = (run: () => void) => (e: MouseEvent) => {
  if (isModifiedClick(e)) return
  e.preventDefault()
  run()
}

const primary =
  'inline-flex h-11 items-center justify-center gap-2 rounded-[10px] bg-[#111] px-5 text-[15px] font-semibold text-white shadow-[0_1px_2px_rgb(0_0_0/0.2)] transition-[background-color,transform] duration-150 hover:bg-[#2b2b2b] active:scale-[0.98]'
const secondary =
  'inline-flex h-11 items-center justify-center gap-2 rounded-[10px] bg-white px-5 text-[15px] font-semibold text-fg shadow-[0_0_0_1px_rgb(0_0_0/0.12)] transition-[background-color,transform] duration-150 hover:bg-[#f7f7f5] active:scale-[0.98]'

function Header({ onHome, onTemplates }: { onHome: () => void; onTemplates: () => void }) {
  // Someone who came here from the editor gets a way straight back to their design.
  const hasDesign = useEditor((s) => s.doc.elements.length > 0 || s.past.length > 0)
  return (
    <header className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
      <a href="/" onClick={spa(onHome)} aria-label="Openbanner home">
        <Logo className="text-[16px]" />
      </a>
      <nav className="flex items-center gap-1 text-sm font-medium text-muted">
        <a href="/templates" onClick={spa(onTemplates)} className="rounded-lg px-3 py-2 transition-colors hover:bg-black/[0.04] hover:text-fg">
          Templates
        </a>
        <a href={REPO_URL} target="_blank" rel="noreferrer" className="flex items-center gap-1 rounded-lg px-3 py-2 transition-colors hover:bg-black/[0.04] hover:text-fg">
          GitHub <ArrowUpRight className="size-3.5" />
        </a>
        {hasDesign && (
          <a href="/edit" onClick={spa(resumeEditing)} className="ml-1 inline-flex h-9 items-center gap-1.5 rounded-[9px] bg-[#111] px-3.5 font-semibold text-white transition-colors hover:bg-[#2b2b2b]">
            My design <ArrowRight className="size-3.5" />
          </a>
        )}
      </nav>
    </header>
  )
}

/** A loose hand-drawn underline, for the one phrase in the headline that matters most. */
function Scribble() {
  return (
    <svg aria-hidden viewBox="0 0 300 18" preserveAspectRatio="none" className="pointer-events-none absolute inset-x-[-2%] -bottom-[0.12em] h-[0.32em] w-[104%] text-[#a9d3ec]">
      <path d="M4 12 C 60 4, 120 5, 170 8 S 260 13, 296 6" fill="none" stroke="currentColor" strokeWidth="7" strokeLinecap="round" />
    </svg>
  )
}

function Home({ onTemplates }: { onTemplates: () => void }) {
  return (
    <>
      <section className="mx-auto max-w-4xl px-4 pt-[clamp(28px,6vh,72px)] text-center sm:px-6">
        <h1 className="animate-rise text-[clamp(38px,5.6vw,68px)] leading-[1.04] font-extrabold tracking-[-0.045em] text-balance">
          Design your LinkedIn banner{' '}
          <span className="relative inline-block whitespace-nowrap">
            <span className="relative z-10">on your profile</span>
            <Scribble />
          </span>
        </h1>
        <p className="mx-auto mt-6 max-w-[36rem] animate-rise text-[18px] leading-relaxed text-pretty text-muted [animation-delay:60ms]">
          A free banner maker that shows your design on a LinkedIn profile, so you can see what your photo covers before you upload it.
        </p>
        <p className="mt-4 animate-rise text-[13px] text-subtle [animation-delay:100ms]">Free, no sign-up, and nothing leaves your browser.</p>
      </section>

      <section aria-label="Try it" className="mt-[clamp(40px,7vh,72px)] animate-rise px-4 [animation-delay:160ms] sm:px-6">
        <TemplateStrip onSeeAll={onTemplates} />
        <div className="mt-8">
          <AnnotatedProfile />
        </div>
      </section>

      <Features />
      <Privacy />

      <section className="mx-auto max-w-3xl px-4 pt-28 text-center sm:px-6">
        <h2 className="text-[clamp(28px,3.4vw,40px)] leading-[1.1] font-extrabold tracking-[-0.035em]">Ready when you are</h2>
        <p className="mt-3 text-[17px] text-muted">It takes about a minute to make a banner you'll keep.</p>
        <div className="mt-7 flex flex-wrap justify-center gap-3">
          <button type="button" className={primary} onClick={() => enterEditor(blankDoc())}>
            Start designing <ArrowRight className="size-4" />
          </button>
          <button type="button" className={secondary} onClick={onTemplates}>
            Browse templates
          </button>
        </div>
      </section>
    </>
  )
}

function TemplatesPage({ onHome }: { onHome: () => void }) {
  const templates = useTemplateDocs(null)
  return (
    <section className="mx-auto max-w-6xl px-4 pt-6 sm:px-6">
      <button type="button" onClick={onHome} className="flex items-center gap-1.5 text-sm font-medium text-muted transition-colors hover:text-fg">
        <ArrowLeft className="size-4" /> Home
      </button>
      <h1 className="mt-6 text-[clamp(32px,4vw,48px)] leading-[1.08] font-extrabold tracking-[-0.04em]">Templates</h1>
      <p className="mt-3 max-w-xl text-[17px] leading-relaxed text-muted">Each one starts with placeholder text that is easy to replace. Pick one to open it in the editor.</p>
      <ul className="mt-10 grid gap-x-6 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
        <li>
          <button
            type="button"
            onClick={(e) => enterEditor(blankDoc(), { from: e.currentTarget.querySelector<HTMLElement>('[data-banner]') })}
            className="group block w-full text-left outline-none"
          >
            <span
              data-banner
              className="flex aspect-[1584/396] items-center justify-center gap-2 rounded-[10px] border-2 border-dashed border-black/15 text-sm font-semibold text-muted transition-colors group-hover:border-black/30 group-hover:text-fg group-focus-visible:border-accent"
            >
              <Plus className="size-4" /> Blank banner
            </span>
            <span className="mt-2 block text-[13px] font-medium text-muted group-hover:text-fg">Blank</span>
          </button>
        </li>
        {templates.map(({ template, doc }) => (
          <li key={template.id}>
            <TemplateTile template={template} doc={doc} />
          </li>
        ))}
      </ul>
    </section>
  )
}

export function Welcome() {
  const scroller = useRef<HTMLDivElement>(null)
  const [page, go] = usePage(scroller)
  return (
    <div ref={scroller} className="h-full overflow-y-auto bg-app">
      <Header onHome={() => go('home')} onTemplates={() => go('templates')} />
      <main>{page === 'home' ? <Home onTemplates={() => go('templates')} /> : <TemplatesPage onHome={() => go('home')} />}</main>
      <footer className="mx-auto mt-28 flex max-w-6xl flex-wrap items-center justify-between gap-4 border-t border-black/[0.07] px-4 py-8 text-sm text-subtle sm:px-6">
        <span className="flex items-center gap-3">
          <Logo className="text-[14px] text-fg" />
          <span>Free and open source. Not affiliated with LinkedIn.</span>
        </span>
        <a href={REPO_URL} target="_blank" rel="noreferrer" className="flex items-center gap-1 transition-colors hover:text-fg">
          GitHub <ArrowUpRight className="size-3.5" />
        </a>
      </footer>
    </div>
  )
}
