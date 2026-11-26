import { CircleDashed, Maximize, Minus, Monitor, Plus, Smartphone, UserRound } from 'lucide-react'
import { fitView } from '@/canvas/fit'
import { Divider, IconButton, Segmented } from '@/components/ui'
import { useEditor } from '@/store/editor'
import { useView } from '@/store/view'

const STEPS = [0.1, 0.25, 0.33, 0.5, 0.67, 0.75, 1, 1.5, 2, 3, 4]

/** Preview and zoom controls, floating at the bottom of the workspace. */
export function ViewBar() {
  const device = useEditor((s) => s.device)
  const showProfile = useEditor((s) => s.showProfile)
  const showSafeZones = useEditor((s) => s.showSafeZones)
  const setView = useEditor((s) => s.setView)
  const scale = useView((s) => s.scale)
  const zoomTo = useView((s) => s.zoomTo)

  return (
    <div className="absolute bottom-3 left-1/2 z-10 flex -translate-x-1/2 items-center gap-0.5 rounded-xl bg-panel/95 p-1 shadow-pop backdrop-blur-md">
      <Segmented
        label="Preview device"
        value={device}
        onChange={(next) => setView({ device: next, showProfile: true })}
        options={[
          { value: 'desktop', title: 'Desktop preview', label: <><Monitor /> <span className="max-sm:hidden">Desktop</span></> },
          { value: 'mobile', title: 'Mobile preview', label: <><Smartphone /> <span className="max-sm:hidden">Mobile</span></> },
        ]}
      />
      <Divider />
      <IconButton label={showProfile ? 'Hide profile preview' : 'Show profile preview'} tooltipSide="top" active={showProfile} onClick={() => setView({ showProfile: !showProfile })}>
        <UserRound />
      </IconButton>
      <IconButton label="Show where the photo covers the banner" tooltipSide="top" active={showSafeZones} onClick={() => setView({ showSafeZones: !showSafeZones })}>
        <CircleDashed />
      </IconButton>
      <Divider />
      <IconButton label="Zoom out" tooltipSide="top" onClick={() => zoomTo([...STEPS].reverse().find((s) => s < scale - 0.01) ?? STEPS[0])}>
        <Minus />
      </IconButton>
      <button type="button" onClick={() => zoomTo(1)} title="Zoom to 100%" className="h-8 w-12 rounded-lg text-xs text-muted tabular-nums hover:bg-hover hover:text-fg max-sm:hidden">
        {Math.round(scale * 100)}%
      </button>
      <IconButton label="Zoom in" tooltipSide="top" onClick={() => zoomTo(STEPS.find((s) => s > scale + 0.01) ?? STEPS[STEPS.length - 1])}>
        <Plus />
      </IconButton>
      <IconButton label="Fit to screen" shortcut="1" tooltipSide="top" onClick={fitView}>
        <Maximize />
      </IconButton>
    </div>
  )
}
