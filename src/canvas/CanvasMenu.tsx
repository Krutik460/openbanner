import type { ReactNode } from 'react'
import { ContextMenu } from 'radix-ui'
import { useEditor } from '@/store/editor'

const MOD = navigator.platform.includes('Mac') ? '⌘' : 'Ctrl+'

function Item({ children, shortcut, onSelect, disabled, danger }: { children: ReactNode; shortcut?: string; onSelect: () => void; disabled?: boolean; danger?: boolean }) {
  return (
    <ContextMenu.Item
      disabled={disabled}
      onSelect={onSelect}
      className={`flex h-8 cursor-pointer items-center justify-between gap-6 rounded-md px-2.5 text-[13px] outline-none select-none data-[disabled]:pointer-events-none data-[disabled]:opacity-40 data-[highlighted]:bg-active ${danger ? 'text-danger' : ''}`}
    >
      {children}
      {shortcut && <span className="text-xs text-subtle">{shortcut}</span>}
    </ContextMenu.Item>
  )
}

const Separator = () => <ContextMenu.Separator className="my-1.5 h-px bg-line" />

/** Right-click menu for the canvas; acts on the current selection. */
export function CanvasMenu() {
  const selection = useEditor((s) => s.selection.length)
  const hasClipboard = useEditor((s) => s.clipboard.length > 0)
  const none = selection === 0
  return (
    <ContextMenu.Portal>
      <ContextMenu.Content className="z-50 min-w-52 animate-pop rounded-xl bg-pop p-1.5 shadow-pop">
        <Item shortcut={`${MOD}C`} disabled={none} onSelect={() => useEditor.getState().copy()}>Copy</Item>
        <Item shortcut={`${MOD}V`} disabled={!hasClipboard} onSelect={() => useEditor.getState().paste()}>Paste</Item>
        <Item shortcut={`${MOD}D`} disabled={none} onSelect={() => useEditor.getState().duplicateSelected()}>Duplicate</Item>
        <Separator />
        <Item shortcut="]" disabled={none} onSelect={() => useEditor.getState().reorder('forward')}>Bring forward</Item>
        <Item shortcut="[" disabled={none} onSelect={() => useEditor.getState().reorder('backward')}>Send backward</Item>
        <Item disabled={none} onSelect={() => useEditor.getState().reorder('front')}>Bring to front</Item>
        <Item disabled={none} onSelect={() => useEditor.getState().reorder('back')}>Send to back</Item>
        <Separator />
        <Item shortcut={`${MOD}A`} onSelect={() => useEditor.getState().select(useEditor.getState().doc.elements.filter((el) => !el.locked && !el.hidden).map((el) => el.id))}>Select all</Item>
        <Separator />
        <Item shortcut="Del" danger disabled={none} onSelect={() => useEditor.getState().removeSelected()}>Delete</Item>
      </ContextMenu.Content>
    </ContextMenu.Portal>
  )
}
