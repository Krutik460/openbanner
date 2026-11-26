import { useEffect, useState } from 'react'
import { Check, ClipboardCopy, Download } from 'lucide-react'
import { Button, Popover, Segmented } from '@/components/ui'
import { BANNER } from '@/lib/constants'
import { downloadBlob, exportBanner, fileSlug, formatBytes, type ExportFormat } from '@/lib/export'
import { useEditor } from '@/store/editor'

/** LinkedIn rejects banner uploads above 8 MB. */
const LINKEDIN_LIMIT = 8_000_000

function ExportForm() {
  const doc = useEditor((s) => s.doc)
  const [format, setFormat] = useState<ExportFormat>('png')
  const [ratio, setRatio] = useState<'1' | '2'>('2')
  const [blob, setBlob] = useState<Blob | null>(null)
  const [error, setError] = useState(false)
  const [copied, setCopied] = useState(false)

  // Render as soon as the options are known, so the size is shown before downloading.
  useEffect(() => {
    let live = true
    setBlob(null)
    setError(false)
    exportBanner(format, Number(ratio)).then(
      (next) => live && setBlob(next),
      () => live && setError(true),
    )
    return () => {
      live = false
    }
  }, [format, ratio, doc])

  const copy = async () => {
    try {
      const png = format === 'png' && blob ? blob : await exportBanner('png', Number(ratio))
      await navigator.clipboard.write([new ClipboardItem({ 'image/png': png })])
      setCopied(true)
      setTimeout(() => setCopied(false), 1600)
    } catch {
      setError(true)
    }
  }

  const tooBig = blob !== null && blob.size > LINKEDIN_LIMIT
  return (
    <div className="w-72 space-y-4 p-1">
      <div>
        <h2 className="text-sm font-semibold">Download banner</h2>
        <p className="mt-0.5 text-xs text-subtle">No watermark. It’s yours.</p>
      </div>
      <div className="space-y-2">
        <Segmented
          className="flex w-full"
          label="Format"
          value={format}
          onChange={setFormat}
          options={[
            { value: 'png', label: 'PNG · sharpest' },
            { value: 'jpeg', label: 'JPG · smallest' },
          ]}
        />
        <Segmented
          className="flex w-full"
          label="Size"
          value={ratio}
          onChange={setRatio}
          options={[
            { value: '1', label: `${BANNER.width} × ${BANNER.height}` },
            { value: '2', label: `${BANNER.width * 2} × ${BANNER.height * 2}` },
          ]}
        />
      </div>
      <p className="h-4 text-xs text-muted" aria-live="polite">
        {error ? (
          <span className="text-danger">Couldn’t create the image. Try the other format.</span>
        ) : !blob ? (
          'Rendering…'
        ) : tooBig ? (
          <span className="text-danger">{formatBytes(blob.size)} — over LinkedIn’s 8 MB limit. Try JPG or the smaller size.</span>
        ) : (
          `${formatBytes(blob.size)} · ready to upload`
        )}
      </p>
      <div className="flex gap-2">
        <Button variant="primary" className="h-10 flex-1" disabled={!blob} onClick={() => blob && downloadBlob(blob, `${fileSlug(doc.name)}-linkedin-banner.${format === 'png' ? 'png' : 'jpg'}`)}>
          <Download className="size-4" /> Download
        </Button>
        <Button className="h-10" onClick={copy} aria-label="Copy image">
          {copied ? <Check className="size-4 text-accent" /> : <ClipboardCopy className="size-4" />}
        </Button>
      </div>
      <p className="border-t border-line pt-3 text-xs leading-relaxed text-subtle">
        On LinkedIn: open your profile, click the camera on the banner, then upload this file.
      </p>
    </div>
  )
}

export function ExportPopover() {
  return (
    <Popover
      align="end"
      trigger={
        <Button variant="primary">
          <Download className="size-4" /> Export
        </Button>
      }
    >
      <ExportForm />
    </Popover>
  )
}
