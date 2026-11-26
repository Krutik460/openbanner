import { useRef } from 'react'
import clsx from 'clsx'
import { ImagePlus, Plus, Trash2 } from 'lucide-react'
import { ColorPanel, Popover, SectionTitle, SliderRow, Button } from '@/components/ui'
import { useAssetImage } from '@/lib/assets'
import { fillToCss, GRADIENTS, isLightFill, MESHES, PATTERNS, SOLIDS } from '@/lib/presets'
import type { BackgroundFill, LinearGradient } from '@/lib/types'
import { useAssets } from '@/store/assets'
import { useEditor } from '@/store/editor'

function sameFill(a: BackgroundFill, b: BackgroundFill): boolean {
  return a === b || JSON.stringify(a) === JSON.stringify(b)
}

function Swatch({ fill, active, onPick, wide }: { fill: BackgroundFill; active: boolean; onPick: () => void; wide?: boolean }) {
  return (
    <button
      type="button"
      aria-label={typeof fill === 'string' ? fill : `${fill.type} gradient`}
      aria-pressed={active}
      onClick={onPick}
      className={clsx(
        'rounded-md ring-1 ring-black/10 transition-transform duration-150 hover:scale-[1.06]',
        wide ? 'aspect-[2/1]' : 'aspect-square',
        active && 'outline-2 outline-offset-2 outline-fg',
      )}
      style={{ background: fillToCss(fill, wide ? 2 : 1) }}
    />
  )
}

function GradientEditor({ gradient }: { gradient: LinearGradient }) {
  const setBackground = useEditor((s) => s.setBackground)
  const update = (next: LinearGradient) => setBackground({ fill: next }, 'bg-gradient')
  return (
    <div className="space-y-3 rounded-lg border border-line bg-raised p-3">
      <div className="flex flex-wrap items-center gap-2">
        {gradient.stops.map((stop, i) => (
          <Popover
            key={i}
            align="start"
            trigger={
              <button type="button" aria-label={`Gradient colour ${i + 1}`} className="size-7 shrink-0 rounded-full ring-1 ring-black/15 transition-transform hover:scale-110" style={{ background: stop.color }} />
            }
          >
            <ColorPanel
              value={stop.color}
              onChange={(color) => color && update({ ...gradient, stops: gradient.stops.map((s, j) => (j === i ? { ...s, color } : s)) })}
            />
          </Popover>
        ))}
        <div className="ml-1 h-7 min-w-16 flex-1 rounded-full ring-1 ring-black/10" style={{ background: fillToCss({ ...gradient, angle: 90 }) }} />
      </div>
      <SliderRow label="Angle" value={gradient.angle} min={0} max={360} step={5} format={(v) => `${v}°`} onChange={(angle) => update({ ...gradient, angle })} />
    </div>
  )
}

export function BackgroundPanel() {
  const background = useEditor((s) => s.doc.background)
  const setBackground = useEditor((s) => s.setBackground)
  const fileRef = useRef<HTMLInputElement>(null)
  const photo = useAssetImage(background.image?.assetId)
  const { fill, pattern } = background
  const pick = (next: BackgroundFill) => setBackground({ fill: next })
  const patternColor = isLightFill(fill) ? '#000000' : '#FFFFFF'

  const onPhoto = async (files: FileList | null) => {
    if (!files?.length) return
    const [asset] = await useAssets.getState().add([files[0]])
    if (asset) setBackground({ image: { assetId: asset.id, opacity: 1 } })
  }

  return (
    <div className="space-y-6">
      <section>
        <SectionTitle>Colour</SectionTitle>
        <div className="grid grid-cols-7 gap-2">
          <Popover
            align="start"
            trigger={
              <button
                type="button"
                aria-label="Custom colour"
                className="flex aspect-square items-center justify-center rounded-md text-white ring-1 ring-black/10 transition-transform hover:scale-[1.06]"
                style={{ background: 'conic-gradient(from 210deg, #ff5f6d, #ffc371, #c8f24b, #22d3ee, #6366f1, #ec4899, #ff5f6d)' }}
              >
                <Plus className="size-4 drop-shadow" />
              </button>
            }
          >
            <ColorPanel value={typeof fill === 'string' ? fill : '#18181B'} onChange={(color) => color && setBackground({ fill: color }, 'bg-colour')} />
          </Popover>
          {SOLIDS.map((color) => (
            <Swatch key={color} fill={color} active={fill === color} onPick={() => pick(color)} />
          ))}
        </div>
      </section>

      <section>
        <SectionTitle>Gradients</SectionTitle>
        <div className="grid grid-cols-4 gap-2">
          {GRADIENTS.map((gradient, i) => (
            <Swatch key={i} wide fill={gradient} active={sameFill(fill, gradient)} onPick={() => pick(gradient)} />
          ))}
        </div>
        {typeof fill !== 'string' && fill.type === 'linear' && (
          <div className="mt-3">
            <GradientEditor gradient={fill} />
          </div>
        )}
      </section>

      <section>
        <SectionTitle>Mesh</SectionTitle>
        <div className="grid grid-cols-4 gap-2">
          {MESHES.map((mesh, i) => (
            <Swatch key={i} wide fill={mesh} active={sameFill(fill, mesh)} onPick={() => pick(mesh)} />
          ))}
        </div>
      </section>

      <section>
        <SectionTitle>Texture</SectionTitle>
        <div className="grid grid-cols-6 gap-1 rounded-lg bg-raised p-0.5">
          {PATTERNS.map(({ label, pattern: preset }) => {
            const active = preset ? pattern?.kind === preset.kind : !pattern
            return (
              <button
                key={label}
                type="button"
                aria-pressed={active}
                onClick={() => setBackground({ pattern: preset ? { ...preset, color: patternColor } : undefined })}
                className={clsx('h-7 rounded-md text-xs font-medium transition-colors', active ? 'bg-panel text-fg shadow-[0_0_0_1px_rgb(0_0_0/0.06),0_1px_2px_rgb(0_0_0/0.12)]' : 'text-muted hover:text-fg')}
              >
                {label}
              </button>
            )
          })}
        </div>
        {pattern && (
          <div className="mt-3 space-y-3">
            <SliderRow label="Strength" value={Math.round(pattern.opacity * 100)} min={2} max={60} format={(v) => `${v}%`} onChange={(v) => setBackground({ pattern: { ...pattern, opacity: v / 100 } }, 'bg-pattern')} />
            {pattern.kind !== 'noise' && (
              <SliderRow label="Spacing" value={pattern.size} min={10} max={96} format={(v) => `${v}px`} onChange={(size) => setBackground({ pattern: { ...pattern, size } }, 'bg-pattern')} />
            )}
          </div>
        )}
      </section>

      <section>
        <SectionTitle>Photo</SectionTitle>
        <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => (onPhoto(e.target.files), (e.target.value = ''))} />
        {background.image ? (
          <div className="space-y-3">
            <div className="relative aspect-[4/1] overflow-hidden rounded-lg bg-raised ring-1 ring-line">
              {photo && <img src={photo.src} alt="" className="size-full object-cover" />}
            </div>
            <SliderRow
              label="Photo opacity"
              value={Math.round(background.image.opacity * 100)}
              min={5}
              max={100}
              format={(v) => `${v}%`}
              onChange={(v) => setBackground({ image: { ...background.image!, opacity: v / 100 } }, 'bg-photo')}
            />
            <p className="text-xs text-subtle">Lower the opacity to tint the photo with the colour behind it.</p>
            <div className="flex gap-2">
              <Button className="flex-1" onClick={() => fileRef.current?.click()}>
                Replace
              </Button>
              <Button onClick={() => setBackground({ image: undefined })} aria-label="Remove photo">
                <Trash2 className="size-3.5" />
              </Button>
            </div>
          </div>
        ) : (
          <Button className="h-10 w-full border-dashed" onClick={() => fileRef.current?.click()}>
            <ImagePlus className="size-4" /> Use a photo as background
          </Button>
        )}
      </section>
    </div>
  )
}
