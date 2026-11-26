import { useEffect, useMemo, useState } from 'react'
import { StaticBanner } from '@/canvas/StaticBanner'
import { loadFonts } from '@/lib/fonts'
import { blankDoc, instantiate, TEMPLATE_FONTS, TEMPLATES, type Template } from '@/lib/templates'
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

  const startBlank = () => {
    const editor = useEditor.getState()
    const replacing = editor.doc.elements.length > 0
    editor.select([])
    editor.mutate((doc) => ({ ...doc, background: blankDoc().background, elements: [] }))
    if (replacing) toast('Cleared the banner', { action: { label: 'Undo', run: () => useEditor.getState().undo() } })
  }

  return (
    <div>
      <h2 className="mb-3 text-sm font-semibold">Templates</h2>
      <ul className="grid grid-cols-2 gap-x-4 gap-y-3 max-sm:grid-cols-1">
        {templates.map(({ template, doc }) => (
          <li key={template.id}>
            <button type="button" onClick={() => apply(template)} className="group block w-full text-left">
              <span className="block overflow-hidden rounded-lg ring-1 ring-line transition-shadow group-hover:ring-2 group-hover:ring-accent">
                <StaticBanner doc={doc} width={264} />
              </span>
              <span className="mt-1.5 block text-xs text-muted group-hover:text-fg">{template.name}</span>
            </button>
          </li>
        ))}
        <li>
          <button type="button" onClick={startBlank} className="group block w-full text-left">
            <span className="flex aspect-[4/1] items-center justify-center rounded-lg border border-dashed border-line-strong text-xs text-muted transition-colors group-hover:border-accent group-hover:text-accent">
              Start from blank
            </span>
            <span className="mt-1.5 block text-xs text-muted">Blank</span>
          </button>
        </li>
      </ul>
    </div>
  )
}
