import { useState } from 'react'
import { CircleAlert, CloudCheck, LoaderCircle, Redo2, Undo2 } from 'lucide-react'
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
      {saveState === 'saving' ? <LoaderCircle className="size-3.5 animate-spin" /> : <CloudCheck className="size-3.5" />}
      <span className="hidden lg:inline">{saveState === 'saving' ? 'Saving…' : 'Saved on this device'}</span>
    </span>
  )
}

function Title() {
  const name = useEditor((s) => s.doc.name)
  const rename = useEditor((s) => s.rename)
  const [draft, setDraft] = useState<string | null>(null)
  return (
    <input
      aria-label="Design name"
      value={draft ?? name}
      onFocus={(e) => (setDraft(name), e.target.select())}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={() => {
        const next = draft?.trim()
        if (next && next !== name) rename(next)
        setDraft(null)
      }}
      onKeyDown={(e) => (e.key === 'Enter' || e.key === 'Escape') && e.currentTarget.blur()}
      size={Math.max(6, (draft ?? name).length)}
      className="h-8 max-w-56 min-w-0 truncate rounded-lg max-sm:hidden border border-transparent bg-transparent px-2 text-[13px] font-medium transition-colors hover:border-line focus:border-line-strong focus:bg-app"
    />
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
        <button type="button" aria-label="Your profile" className="flex h-8 items-center gap-2 rounded-full pr-2.5 pl-1 text-[13px] transition-colors hover:bg-hover data-[state=open]:bg-active">
          <Avatar profile={profile} size={24} />
          <span className="hidden max-w-28 truncate md:inline">{profile?.name.split(/\s+/)[0] || 'Add profile'}</span>
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
    <header className="flex h-[52px] shrink-0 items-center gap-2 border-b border-line bg-panel px-3">
      <Logo compact className="mr-1 text-sm [&>svg]:h-4" />
      <Divider className="max-sm:hidden" />
      <Title />
      <SaveStatus />
      <div className="flex-1" />
      <IconButton label="Undo" shortcut={`${mod}Z`} disabled={!canUndo} onClick={() => useEditor.getState().undo()}>
        <Undo2 />
      </IconButton>
      <IconButton label="Redo" shortcut={`${mod}⇧Z`} disabled={!canRedo} onClick={() => useEditor.getState().redo()}>
        <Redo2 />
      </IconButton>
      <Divider />
      <ProfileMenu />
      <ExportPopover />
    </header>
  )
}
