import { Plus } from 'lucide-react'
import { SectionTitle } from '@/components/ui'
import { personaOf } from '@/lib/templates'
import type { TextElement } from '@/lib/types'
import { useEditor } from '@/store/editor'
import { addText } from '../actions'

type Preset = Partial<TextElement> & { text: string }

const BASICS: { label: string; className: string; preset: Preset }[] = [
  {
    label: 'Add a heading',
    className: 'text-[22px] font-bold tracking-tight',
    preset: { text: 'Your headline', fontFamily: 'Bricolage Grotesque Variable', fontSize: 68, fontWeight: 700, lineHeight: 1.05, letterSpacing: -1, width: 720 },
  },
  {
    label: 'Add a subheading',
    className: 'text-[15px] font-medium',
    preset: { text: 'A supporting line', fontSize: 30, fontWeight: 500, lineHeight: 1.2, width: 560 },
  },
  {
    label: 'Add body text',
    className: 'text-xs text-muted',
    preset: { text: 'A little more detail about what you do.', fontSize: 20, fontWeight: 400, lineHeight: 1.4, width: 480 },
  },
]

const STYLES: { sample: string; preset: Preset; preview: { family: string; weight: number; size: number; italic?: boolean; spacing?: number } }[] = [
  { sample: 'Bold statement', preset: { text: 'Bold statement', fontFamily: 'Bricolage Grotesque Variable', fontSize: 60, fontWeight: 800, letterSpacing: -1.5, lineHeight: 1.05, width: 640 }, preview: { family: 'Bricolage Grotesque Variable', weight: 800, size: 19 } },
  { sample: 'Editorial flair', preset: { text: 'Editorial flair', fontFamily: 'Instrument Serif', italic: true, fontSize: 72, fontWeight: 400, letterSpacing: -1, lineHeight: 1, width: 600 }, preview: { family: 'Instrument Serif', weight: 400, size: 23, italic: true } },
  { sample: 'SMALL LABEL', preset: { text: 'Small label', fontFamily: 'JetBrains Mono Variable', fontSize: 18, fontWeight: 500, letterSpacing: 3, uppercase: true, width: 360 }, preview: { family: 'JetBrains Mono Variable', weight: 500, size: 12, spacing: 2 } },
  { sample: 'LOUD & CLEAR', preset: { text: 'Loud & clear', fontFamily: 'Bebas Neue', fontSize: 110, fontWeight: 400, letterSpacing: 1, uppercase: true, lineHeight: 0.95, width: 640 }, preview: { family: 'Bebas Neue', weight: 400, size: 24, spacing: 0.5 } },
  { sample: 'Timeless classic', preset: { text: 'Timeless classic', fontFamily: 'Playfair Display Variable', fontSize: 58, fontWeight: 600, letterSpacing: -0.5, lineHeight: 1.08, width: 640 }, preview: { family: 'Playfair Display Variable', weight: 600, size: 19 } },
  { sample: 'Friendly hello', preset: { text: 'Friendly hello', fontFamily: 'Outfit Variable', fontSize: 58, fontWeight: 700, letterSpacing: -1, lineHeight: 1.08, width: 600 }, preview: { family: 'Outfit Variable', weight: 700, size: 19 } },
  { sample: 'A personal note', preset: { text: 'A personal note', fontFamily: 'Caveat Variable', fontSize: 68, fontWeight: 700, lineHeight: 1.05, width: 560 }, preview: { family: 'Caveat Variable', weight: 700, size: 24 } },
  { sample: 'Built different', preset: { text: 'Built different', fontFamily: 'Space Grotesk Variable', fontSize: 58, fontWeight: 700, letterSpacing: -2, lineHeight: 1.05, width: 600 }, preview: { family: 'Space Grotesk Variable', weight: 700, size: 19 } },
]

export function TextPanel() {
  const profile = useEditor((s) => s.profile)
  const persona = personaOf(profile)
  const fromProfile: { label: string; preset: Preset }[] = profile
    ? [
        { label: persona.name, preset: { text: persona.name, fontFamily: 'Bricolage Grotesque Variable', fontSize: 64, fontWeight: 700, letterSpacing: -1, lineHeight: 1.05, width: 720 } },
        { label: persona.tagline, preset: { text: persona.tagline, fontSize: 28, fontWeight: 500, lineHeight: 1.25, width: 640 } },
      ]
    : []

  return (
    <div className="space-y-6">
      <section className="space-y-2">
        {BASICS.map(({ label, className, preset }) => (
          <button
            key={label}
            type="button"
            onClick={() => addText(preset)}
            className="group flex h-14 w-full items-center justify-between rounded-lg border border-line bg-raised px-3.5 text-left transition-colors hover:border-line-strong hover:bg-hover"
          >
            <span className={className}>{label}</span>
            <Plus className="size-4 text-subtle transition-colors group-hover:text-fg" />
          </button>
        ))}
      </section>

      {fromProfile.length > 0 && (
        <section>
          <SectionTitle>From your profile</SectionTitle>
          <div className="space-y-2">
            {fromProfile.map(({ label, preset }) => (
              <button
                key={label}
                type="button"
                onClick={() => addText(preset)}
                className="flex w-full items-center gap-2 rounded-lg border border-dashed border-line-strong px-3 py-2.5 text-left transition-colors hover:bg-hover"
              >
                <span className="min-w-0 flex-1 truncate">{label}</span>
                <Plus className="size-3.5 shrink-0 text-subtle" />
              </button>
            ))}
          </div>
        </section>
      )}

      <section>
        <SectionTitle>Styles</SectionTitle>
        <div className="grid grid-cols-2 gap-2">
          {STYLES.map(({ sample, preset, preview }) => (
            <button
              key={sample}
              type="button"
              onClick={() => addText(preset)}
              className="flex h-[72px] items-center justify-center rounded-lg border border-line bg-raised px-2 text-center leading-tight transition-colors hover:border-line-strong hover:bg-hover"
              style={{ fontFamily: `"${preview.family}"`, fontWeight: preview.weight, fontSize: preview.size, fontStyle: preview.italic ? 'italic' : undefined, letterSpacing: preview.spacing }}
            >
              {sample}
            </button>
          ))}
        </div>
      </section>

      <p className="text-xs text-subtle">Double-click any text on the banner to edit it.</p>
    </div>
  )
}
