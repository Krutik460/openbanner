import { CircleAlert, LoaderCircle, Lock, Redo2, Undo2 } from 'lucide-react'
import { Divider, IconButton, Logo, Popover, Button } from '@/components/ui'
import { useEditor } from '@/store/editor'
import { rememberProfile } from '@/store/persistence'
import { ExportPopover } from './ExportPopover'
import { Avatar, ProfileFields } from './ProfileFields'

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
    <span className="flex items-center gap-1.5 text-xs text-subtle" aria-live="polite" title="Your design is stored only in this browser. Nothing is uploaded.">
      {saveState === 'saving' ? <LoaderCircle className="size-3.5 animate-spin" /> : <Lock className="size-3.5" />}
      <span className="max-sm:hidden">{saveState === 'saving' ? 'Saving…' : 'Saved on this device'}</span>
    </span>
  )
}

function ProfileMenu() {
  const profile = useEditor((s) => s.profile)
  const current = profile ?? { name: '', headline: '' }
  return (
    <Popover
      align="end"
      className="w-80"
      trigger={
        <button type="button" aria-label="Edit profile preview" title="Edit profile preview" className="mx-1 flex size-8 items-center justify-center rounded-full transition-shadow hover:ring-2 hover:ring-line-strong data-[state=open]:ring-2 data-[state=open]:ring-accent">
          <Avatar profile={profile} size={28} />
        </button>
      }
    >
      <div className="space-y-4 p-1">
        <div>
          <h2 className="text-sm font-semibold">Profile preview</h2>
          <p className="mt-0.5 text-xs text-subtle">Shown under the banner so you can design around it. It is not part of the exported image.</p>
        </div>
        <ProfileFields profile={current} onChange={rememberProfile} />
        <Button className="w-full" onClick={() => useEditor.getState().setScreen('welcome')}>
          Look up a different LinkedIn profile
        </Button>
      </div>
    </Popover>
  )
}

export function TopBar() {
  const canUndo = useEditor((s) => s.past.length > 0)
  const canRedo = useEditor((s) => s.future.length > 0)
  const mod = navigator.platform.includes('Mac') ? '⌘' : 'Ctrl+'
  return (
    <header className="flex h-14 shrink-0 items-center gap-1.5 border-b border-line bg-panel px-4">
      <Logo compact className="text-[15px]" />
      <div className="flex-1" />
      <SaveStatus />
      <Divider className="mx-2" />
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
