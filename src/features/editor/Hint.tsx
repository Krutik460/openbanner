import { useEffect, useState } from 'react'
import { MousePointer2 } from 'lucide-react'
import { useEditor } from '@/store/editor'

const KEY = 'openbanner:knows-how-to-select'

function seen(): boolean {
  try {
    return localStorage.getItem(KEY) === '1'
  } catch {
    return true
  }
}

/** A one-time pointer for first-time visitors, gone for good after their first selection. */
export function Hint() {
  const hasSelection = useEditor((s) => s.selection.length > 0)
  const hasElements = useEditor((s) => s.doc.elements.length > 0)
  const [done, setDone] = useState(seen)

  useEffect(() => {
    if (!hasSelection || done) return
    setDone(true)
    try {
      localStorage.setItem(KEY, '1')
    } catch {
      // Without storage the hint simply shows again next visit.
    }
  }, [hasSelection, done])

  if (done || !hasElements) return null
  return (
    <p className="pointer-events-none absolute top-3 left-1/2 z-10 flex h-10 -translate-x-1/2 animate-pop items-center gap-2 rounded-xl bg-panel/95 px-3.5 text-xs whitespace-nowrap text-muted shadow-pop backdrop-blur-md">
      <MousePointer2 className="size-3.5 text-accent-strong" />
      Click anything on the banner to edit it. Click text twice to retype it.
    </p>
  )
}
