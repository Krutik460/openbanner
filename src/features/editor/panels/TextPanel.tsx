import { Plus } from 'lucide-react'
import { personaOf } from '@/lib/templates'
import type { TextElement } from '@/lib/types'
import { useEditor } from '@/store/editor'
import { addText } from '../actions'

type Preset = Partial<TextElement> & { text: string }

const BASICS: { label: string; className: string; preset: Preset }[] = [
  {
    label: 'Heading',
    className: 'text-xl font-bold tracking-tight',
    preset: { text: 'Your headline', fontFamily: 'Inter Variable', fontSize: 64, fontWeight: 700, lineHeight: 1.05, letterSpacing: -1.5, width: 720 },
  },
  {
    label: 'Subheading',
    className: 'text-[15px] font-medium',
    preset: { text: 'A supporting line', fontFamily: 'Inter Variable', fontSize: 30, fontWeight: 500, lineHeight: 1.2, width: 560 },
  },
  {
    label: 'Body text',
    className: 'text-xs text-muted',
    preset: { text: 'A little more detail about what you do.', fontFamily: 'Inter Variable', fontSize: 20, fontWeight: 400, lineHeight: 1.4, width: 480 },
  },
]

const row = 'group flex w-full items-center justify-between rounded-lg px-3 text-left transition-colors hover:bg-hover'

export function TextPanel({ onAdd }: { onAdd: () => void }) {
  const profile = useEditor((s) => s.profile)
  const persona = personaOf(profile)
  const add = (preset: Preset) => (addText(preset), onAdd())
  const fromProfile: { label: string; preset: Preset }[] = profile?.name
    ? [
        { label: persona.name, preset: { ...BASICS[0].preset, text: persona.name } },
        { label: persona.tagline, preset: { ...BASICS[1].preset, text: persona.tagline, width: 640 } },
      ]
    : []

  return (
    <div>
      <h2 className="mb-2 text-sm font-semibold">Add text</h2>
      <div className="-mx-1">
        {BASICS.map(({ label, className, preset }) => (
          <button key={label} type="button" onClick={() => add(preset)} className={`${row} h-12`}>
            <span className={className}>{label}</span>
            <Plus className="size-4 text-subtle group-hover:text-fg" />
          </button>
        ))}
      </div>
      {fromProfile.length > 0 && (
        <>
          <h3 className="mt-3 mb-1 border-t border-line pt-3 text-xs text-muted">From your profile</h3>
          <div className="-mx-1">
            {fromProfile.map(({ label, preset }) => (
              <button key={label} type="button" onClick={() => add(preset)} className={`${row} h-9`}>
                <span className="min-w-0 flex-1 truncate">{label}</span>
                <Plus className="size-4 shrink-0 text-subtle group-hover:text-fg" />
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
