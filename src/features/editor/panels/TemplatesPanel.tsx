import { useEffect, useMemo, useState } from 'react'
import { StaticBanner } from '@/canvas/StaticBanner'
import { loadFonts } from '@/lib/fonts'
import { instantiate, TEMPLATE_FONTS, TEMPLATES, type Template } from '@/lib/templates'
import type { BannerDoc, Profile } from '@/lib/types'
import { useEditor } from '@/store/editor'
import { toast } from '@/store/toasts'

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
    const replacing = editor.doc.elements.length > 0
    editor.select([])
    editor.mutate((doc) => ({
      ...doc,
      name: doc.name === 'Untitled banner' ? template.name : doc.name,
      background: fresh.background,
      elements: fresh.elements,
    }))
    if (replacing) toast(`${template.name} applied`, { action: { label: 'Undo', run: () => useEditor.getState().undo() } })
  }

  return (
    <ul className="space-y-4">
      {templates.map(({ template, doc }) => (
        <li key={template.id}>
          <button type="button" onClick={() => apply(template)} className="group block w-full text-left">
            <span className="block overflow-hidden rounded-lg ring-1 ring-line transition-[box-shadow,transform] duration-200 group-hover:-translate-y-0.5 group-hover:ring-2 group-hover:ring-fg/60">
              <StaticBanner doc={doc} width={280} />
            </span>
            <span className="mt-1.5 block text-xs text-muted transition-colors group-hover:text-fg">{template.name}</span>
          </button>
        </li>
      ))}
    </ul>
  )
}
