import { useEffect, useRef, useState } from 'react'
import clsx from 'clsx'
import { ImageUp, Lock, PaintBucket, Trash2 } from 'lucide-react'
import { Tooltip } from '@/components/ui'
import { useAssetImage } from '@/lib/assets'
import type { AssetMeta } from '@/lib/storage'
import { useAssets } from '@/store/assets'
import { useEditor } from '@/store/editor'
import { toast } from '@/store/toasts'
import { addImage, addImageFiles } from '../actions'

function AssetTile({ asset, onAdd }: { asset: AssetMeta; onAdd: () => void }) {
  const image = useAssetImage(asset.id)

  const remove = async () => {
    const editor = useEditor.getState()
    // Take it off the open design first so nothing is left pointing at a missing file.
    editor.mutate((doc) => ({
      ...doc,
      background: doc.background.image?.assetId === asset.id ? { ...doc.background, image: undefined } : doc.background,
      elements: doc.elements.filter((el) => !(el.type === 'image' && el.assetId === asset.id)),
    }))
    await useAssets.getState().remove(asset.id)
  }

  return (
    <div className="group relative aspect-[4/3] overflow-hidden rounded-lg bg-raised ring-1 ring-line">
      <button type="button" aria-label={`Add ${asset.name} to the banner`} onClick={() => (addImage(asset), onAdd())} className="block size-full">
        {image && <img src={image.src} alt="" className="size-full object-cover transition-transform duration-300 group-hover:scale-105" />}
      </button>
      <div className="absolute top-1.5 right-1.5 flex gap-1 opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100">
        <Tooltip label="Use as background">
          <button
            type="button"
            aria-label="Use as background"
            onClick={() => {
              useEditor.getState().setBackground({ image: { assetId: asset.id, opacity: 1 } })
              toast('Photo set as background', { action: { label: 'Undo', run: () => useEditor.getState().undo() } })
            }}
            className="flex size-7 items-center justify-center rounded-md bg-black/70 text-white backdrop-blur hover:bg-black"
          >
            <PaintBucket className="size-3.5" />
          </button>
        </Tooltip>
        <Tooltip label="Delete upload">
          <button type="button" aria-label="Delete upload" onClick={remove} className="flex size-7 items-center justify-center rounded-md bg-black/70 text-white backdrop-blur hover:bg-danger">
            <Trash2 className="size-3.5" />
          </button>
        </Tooltip>
      </div>
    </div>
  )
}

export function UploadsPanel({ onAdd }: { onAdd: () => void }) {
  const { assets, loaded, load } = useAssets()
  const fileRef = useRef<HTMLInputElement>(null)
  const [over, setOver] = useState(false)
  const [busy, setBusy] = useState(false)

  useEffect(() => void load(), [load])

  const take = async (files: FileList | null) => {
    if (!files?.length) return
    setBusy(true)
    const count = await addImageFiles(files)
    setBusy(false)
    if (count === 0) toast('That file could not be read as an image', { tone: 'error' })
    else onAdd()
  }

  return (
    <div className="space-y-4">
      <input ref={fileRef} type="file" accept="image/*" multiple hidden onChange={(e) => (take(e.target.files), (e.target.value = ''))} />
      <button
        type="button"
        onClick={() => fileRef.current?.click()}
        onDragOver={(e) => (e.preventDefault(), setOver(true))}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => (e.preventDefault(), e.stopPropagation(), setOver(false), take(e.dataTransfer.files))}
        className={clsx(
          'flex w-full flex-col items-center gap-1.5 rounded-xl border border-dashed px-4 py-6 text-center transition-colors',
          over ? 'border-accent bg-accent/10' : 'border-line-strong hover:bg-hover',
        )}
      >
        <span className="flex size-9 items-center justify-center rounded-full bg-raised">
          <ImageUp className="size-4" />
        </span>
        <span className="font-medium">{busy ? 'Adding…' : 'Upload an image'}</span>
        <span className="text-xs text-subtle">A logo, photo or screenshot. You can also drop it straight onto the banner.</span>
      </button>

      {loaded && assets.length > 0 && (
        <div className="grid grid-cols-2 gap-2">
          {assets.map((asset) => (
            <AssetTile key={asset.id} asset={asset} onAdd={onAdd} />
          ))}
        </div>
      )}
      <p className="flex items-center gap-1.5 text-xs text-subtle">
        <Lock className="size-3 shrink-0" /> Images stay on this device. They are never uploaded.
      </p>
    </div>
  )
}
