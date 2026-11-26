import { Keyboard, Minus, Plus } from 'lucide-react'
import { fitView } from '@/canvas/fit'
import { IconButton, Popover } from '@/components/ui'
import { useView } from '@/store/view'

const STEPS = [0.1, 0.25, 0.33, 0.5, 0.67, 0.75, 1, 1.5, 2, 3, 4]
const MOD = navigator.platform.includes('Mac') ? '⌘' : 'Ctrl'
const SHORTCUTS: [string, string][] = [
  ['Edit text', 'Click selected text'],
  ['Undo / redo', `${MOD} Z / ${MOD} ⇧ Z`],
  ['Duplicate', `${MOD} D`],
  ['Copy / paste', `${MOD} C / ${MOD} V`],
  ['Delete', 'Del'],
  ['Nudge (×10 with ⇧)', 'Arrow keys'],
  ['Forward / backward', '] / ['],
  ['Add to selection', '⇧ click'],
  ['Zoom', `${MOD} scroll`],
  ['Pan', 'Space + drag'],
  ['Fit to screen', '1'],
]

/** Quiet corner controls: zoom and the shortcut list. */
export function ViewControls() {
  const scale = useView((s) => s.scale)
  const zoomTo = useView((s) => s.zoomTo)

  return (
    <div className="absolute right-4 bottom-4 z-10 flex items-center rounded-xl bg-pop p-1 shadow-pop max-lg:hidden">
      <IconButton label="Zoom out" tooltipSide="top" onClick={() => zoomTo([...STEPS].reverse().find((s) => s < scale - 0.01) ?? STEPS[0])}>
        <Minus />
      </IconButton>
      <button type="button" onClick={fitView} title="Fit to screen" className="h-8 w-12 rounded-lg text-xs text-muted tabular-nums hover:bg-hover hover:text-fg">
        {Math.round(scale * 100)}%
      </button>
      <IconButton label="Zoom in" tooltipSide="top" onClick={() => zoomTo(STEPS.find((s) => s > scale + 0.01) ?? STEPS[STEPS.length - 1])}>
        <Plus />
      </IconButton>
      <Popover
        side="top"
        align="end"
        className="w-64"
        trigger={
          <IconButton label="Keyboard shortcuts" tooltipSide="top">
            <Keyboard />
          </IconButton>
        }
      >
        <h2 className="mb-2 px-1 text-sm font-semibold">Shortcuts</h2>
        <dl>
          {SHORTCUTS.map(([action, keys]) => (
            <div key={action} className="flex items-center justify-between px-1 py-1 text-xs">
              <dt className="text-muted">{action}</dt>
              <dd className="text-fg">{keys}</dd>
            </div>
          ))}
          </dl>
        </Popover>
    </div>
  )
}
