import { useEffect, useMemo, useState } from 'react'
import { StaticBanner } from '@/canvas/StaticBanner'
import { loadFonts } from '@/lib/fonts'
import { instantiate, TEMPLATE_FONTS, TEMPLATES, type Template } from '@/lib/templates'
import type { BannerDoc, Profile } from '@/lib/types'
import { useEditor } from '@/store/editor'

/**
 * Templates built for the given profile. They are rebuilt once their fonts
 * have loaded, because text is laid out by measuring it.
 */
export function useTemplateDocs(profile: Profile | null): { template: Template; doc: BannerDoc }[] {
  const [fontsReady, setFontsReady] = useState(false)
  useEffect(() => {
    let live = true
    loadFonts(TEMPLATE_FONTS).then(() => live && setFontsReady(true))
    return () => {
      live = false
    }
  }, [])
  return useMemo(
    () => TEMPLATES.map((template) => ({ template, doc: instantiate(template, profile) })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [profile?.name, profile?.headline, fontsReady],
  )
}

export function TemplatesPanel() {
  const profile = useEditor((s) => s.profile)
  const templates = useTemplateDocs(profile)

  const apply = (template: Template) => {
    const editor = useEditor.getState()
    // Build fresh so the applied elements get their own ids.
    const fresh = instantiate(template, editor.profile)
    editor.select([])
    editor.mutate((doc) => ({
      ...doc,
      name: doc.name === 'Untitled banner' ? template.name : doc.name,
      background: fresh.background,
      elements: fresh.elements,
    }))
  }

  return (
    <div className="space-y-3">
      <p className="text-xs leading-relaxed text-subtle">
        Each one is filled in with your name and headline. Picking one replaces the current design — undo brings it back.
      </p>
      <ul className="space-y-3">
        {templates.map(({ template, doc }) => (
          <li key={template.id}>
            <button
              type="button"
              onClick={() => apply(template)}
              className="group relative block w-full overflow-hidden rounded-lg ring-1 ring-line transition-[box-shadow,transform] duration-200 hover:-translate-y-0.5 hover:ring-2 hover:ring-fg/60"
            >
              <StaticBanner doc={doc} width={280} />
              <span className="absolute bottom-1.5 left-1.5 rounded-md bg-black/70 px-1.5 py-0.5 text-[11px] font-medium text-white opacity-0 backdrop-blur transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
                {template.name}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
