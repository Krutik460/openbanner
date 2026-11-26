import { CircleAlert, CircleDashed, LoaderCircle, Lock, Monitor, Redo2, Smartphone, Undo2 } from 'lucide-react'
import { Divider, IconButton, Logo, Popover, Segmented } from '@/components/ui'
import { isModifiedClick } from '@/lib/route'
import { useEditor } from '@/store/editor'
import { goHome } from '@/store/persistence'
import { ExportPopover } from './ExportPopover'
import { Avatar, ProfilePanel } from './ProfileFields'

function SaveStatus() {
  const saveState = useEditor((s) => s.saveState)
  if (saveState === 'error') {
    return (
      <span className="flex items-center gap-1.5 text-xs text-danger" title="Your browser refused to store the design (storage may be full or disabled).">
        <CircleAlert className="size-3.5" /> Not saved
      </span>
    )
  }
  return (
    <span className="flex items-center gap-1.5 text-xs text-subtle max-sm:hidden" aria-live="polite" title="Your design is stored only in this browser. Nothing is uploaded.">
      {saveState === 'saving' ? <LoaderCircle className="size-3.5 animate-spin" /> : <Lock className="size-3.5" />}
      <span className="whitespace-nowrap max-lg:hidden">{saveState === 'saving' ? 'Saving…' : 'Saved on this device'}</span>
    </span>
  )
}

function ProfileMenu() {
  const profile = useEditor((s) => s.profile)
  return (
    <Popover
      align="end"
      className="w-80"
      trigger={
        <button type="button" aria-label="Edit profile preview" title="Edit profile preview" className="mx-1 flex size-8 items-center justify-center rounded-full max-sm:hidden transition-shadow hover:ring-2 hover:ring-line-strong data-[state=open]:ring-2 data-[state=open]:ring-accent">
          <Avatar profile={profile} size={28} />
        </button>
      }
    >
      <ProfilePanel />
    </Popover>
  )
}

/** How the banner is previewed: on a desktop or a phone profile, and what the photo covers. */
function PreviewSwitch() {
  const device = useEditor((s) => s.device)
  const showSafeZones = useEditor((s) => s.showSafeZones)
  const setView = useEditor((s) => s.setView)
  return (
    <div className="flex items-center gap-1 max-sm:ml-2 xl:absolute xl:left-1/2 xl:-translate-x-1/2">
      <Segmented
        label="Preview device"
        value={device}
        onChange={(next) => setView({ device: next })}
        options={[
          { value: 'desktop', title: 'Preview on desktop', label: <><Monitor /><span className="max-md:hidden">Desktop</span></> },
          { value: 'mobile', title: 'Preview on mobile', label: <><Smartphone /><span className="max-md:hidden">Mobile</span></> },
        ]}
      />
      <IconButton label="Show where your photo covers the banner" active={showSafeZones} onClick={() => setView({ showSafeZones: !showSafeZones })}>
        <CircleDashed />
      </IconButton>
    </div>
  )
}

export function TopBar() {
  const canUndo = useEditor((s) => s.past.length > 0)
  const canRedo = useEditor((s) => s.future.length > 0)
  const mod = navigator.platform.includes('Mac') ? '⌘' : 'Ctrl+'
  return (
    <header className="relative flex h-14 shrink-0 items-center gap-1.5 border-b border-line bg-panel px-4 max-sm:px-3">
      <a
        href="/"
        aria-label="Openbanner home"
        title="Home and templates"
        onClick={(e) => isModifiedClick(e) || (e.preventDefault(), goHome())}
        className="-mx-1.5 rounded-lg px-1.5 py-1 transition-colors hover:bg-hover"
      >
        <Logo compact className="text-[15px]" />
      </a>
      <Divider className="mx-2 xl:hidden max-sm:hidden" />
      <PreviewSwitch />
      <div className="flex-1" />
      <SaveStatus />
      <Divider className="mx-2 max-sm:hidden" />
      <IconButton label="Undo" shortcut={`${mod}Z`} disabled={!canUndo} onClick={() => useEditor.getState().undo()}>
        <Undo2 />
      </IconButton>
      <IconButton label="Redo" shortcut={`${mod}⇧Z`} disabled={!canRedo} onClick={() => useEditor.getState().redo()}>
        <Redo2 />
      </IconButton>
      <ProfileMenu />
      <ExportPopover />
    </header>
  )
}
