import { useEffect, useState } from 'react'
import clsx from 'clsx'
import { Copy, Plus, Trash2 } from 'lucide-react'
import { StaticBanner } from '@/canvas/StaticBanner'
import { Button, Tooltip } from '@/components/ui'
import * as storage from '@/lib/storage'
import { blankDoc } from '@/lib/templates'
import type { BannerDoc } from '@/lib/types'
import { uid } from '@/lib/util'
import { useEditor } from '@/store/editor'

export function DesignsPanel() {
  const current = useEditor((s) => s.doc)
  const [others, setOthers] = useState<BannerDoc[]>([])
  const [confirming, setConfirming] = useState<string | null>(null)

  const refresh = async (currentId: string) => {
    const metas = await storage.listDesigns().catch(() => [])
    const docs = await Promise.all(metas.filter((m) => m.id !== currentId).map((m) => storage.loadDesign(m.id)))
    setOthers(docs.filter((d): d is BannerDoc => Boolean(d)))
  }
  useEffect(() => void refresh(current.id), [current.id])

  // Write the open design before leaving it, so a pending autosave is never lost.
  const leaveFor = async (doc: BannerDoc) => {
    await storage.saveDesign(useEditor.getState().doc).catch(() => {})
    useEditor.getState().openDoc(doc)
  }

  const create = async () => {
    await leaveFor(blankDoc())
    useEditor.getState().setPanel('templates')
  }

  const duplicate = async (doc: BannerDoc) => {
    const copy: BannerDoc = { ...doc, id: uid(), name: `${doc.name} copy`, updatedAt: Date.now(), elements: doc.elements.map((el) => ({ ...el, id: uid() })) }
    await leaveFor(copy)
  }

  const remove = async (doc: BannerDoc) => {
    setConfirming(null)
    await storage.deleteDesign(doc.id).catch(() => {})
    await refresh(current.id)
  }

  // `others` is refreshed asynchronously, so it can briefly still hold the design that was just opened.
  const all = [current, ...others.filter((doc) => doc.id !== current.id)]
  return (
    <div className="space-y-4">
      <Button className="h-10 w-full" onClick={create}>
        <Plus className="size-4" /> New design
      </Button>
      <ul className="space-y-3">
        {all.map((doc) => {
          const open = doc.id === current.id
          return (
            <li key={doc.id} className="group">
              <button
                type="button"
                disabled={open}
                onClick={() => leaveFor(doc)}
                className={clsx('block w-full overflow-hidden rounded-lg ring-1 transition-shadow', open ? 'ring-2 ring-fg' : 'ring-line hover:ring-2 hover:ring-fg/60')}
              >
                <StaticBanner doc={doc} width={280} />
              </button>
              {confirming === doc.id ? (
                <div className="mt-1.5 flex h-7 items-center gap-1.5">
                  <span className="min-w-0 flex-1 truncate text-muted">Delete this design for good?</span>
                  <Button size="sm" variant="ghost" onClick={() => setConfirming(null)}>
                    Keep
                  </Button>
                  <Button size="sm" className="border-danger/40 text-danger hover:border-danger" onClick={() => remove(doc)}>
                    Delete
                  </Button>
                </div>
              ) : (
                <div className="mt-1.5 flex h-7 items-center gap-1">
                  <span className="min-w-0 flex-1 truncate">
                    {doc.name}
                    {open && <span className="ml-2 text-xs text-subtle">Open now</span>}
                  </span>
                  <Tooltip label="Duplicate">
                    <button type="button" aria-label={`Duplicate ${doc.name}`} onClick={() => duplicate(doc)} className="flex size-7 items-center justify-center rounded-md text-subtle hover:bg-hover hover:text-fg">
                      <Copy className="size-3.5" />
                    </button>
                  </Tooltip>
                  {!open && (
                    <Tooltip label="Delete">
                      <button type="button" aria-label={`Delete ${doc.name}`} onClick={() => setConfirming(doc.id)} className="flex size-7 items-center justify-center rounded-md text-subtle hover:bg-hover hover:text-danger">
                        <Trash2 className="size-3.5" />
                      </button>
                    </Tooltip>
                  )}
                </div>
              )}
            </li>
          )
        })}
      </ul>
      <p className="text-xs text-subtle">Designs save automatically to this browser.</p>
    </div>
  )
}
