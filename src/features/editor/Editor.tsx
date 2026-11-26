import { useEffect, useState } from 'react'
import clsx from 'clsx'
import { FolderOpen, ImageUp, Keyboard, Layers, LayoutTemplate, PaintBucket, Shapes, Type, X } from 'lucide-react'
import { EditorStage } from '@/canvas/EditorStage'
import { fitView } from '@/canvas/fit'
import { IconButton, Popover } from '@/components/ui'
import { useEditor, type PanelId } from '@/store/editor'
import { useView } from '@/store/view'
import { addImageFiles } from './actions'
import { ContextBar } from './ContextBar'
import { BackgroundPanel } from './panels/BackgroundPanel'
import { DesignsPanel } from './panels/DesignsPanel'
import { ElementsPanel } from './panels/ElementsPanel'
import { LayersPanel } from './panels/LayersPanel'
import { TemplatesPanel } from './panels/TemplatesPanel'
import { TextPanel } from './panels/TextPanel'
import { UploadsPanel } from './panels/UploadsPanel'
import { ProfileMock } from './ProfileMock'
import { TopBar } from './TopBar'
import { ViewBar } from './ViewBar'

const PANELS: { id: PanelId; label: string; icon: typeof Type; view: () => React.JSX.Element }[] = [
  { id: 'templates', label: 'Templates', icon: LayoutTemplate, view: TemplatesPanel },
  { id: 'background', label: 'Background', icon: PaintBucket, view: BackgroundPanel },
  { id: 'text', label: 'Text', icon: Type, view: TextPanel },
  { id: 'elements', label: 'Elements', icon: Shapes, view: ElementsPanel },
  { id: 'uploads', label: 'Uploads', icon: ImageUp, view: UploadsPanel },
  { id: 'layers', label: 'Layers', icon: Layers, view: LayersPanel },
  { id: 'designs', label: 'Designs', icon: FolderOpen, view: DesignsPanel },
]

const isMac = navigator.platform.includes('Mac')
const MOD = isMac ? '⌘' : 'Ctrl'
const SHORTCUTS: [string, string][] = [
  ['Edit text', 'Double-click'],
  ['Undo / redo', `${MOD} Z / ${MOD} ⇧ Z`],
  ['Duplicate', `${MOD} D`],
  ['Copy / paste', `${MOD} C / ${MOD} V`],
  ['Select all', `${MOD} A`],
  ['Delete', 'Del'],
  ['Nudge (×10 with ⇧)', 'Arrow keys'],
  ['Forward / backward', '] / ['],
  ['Add to selection', '⇧ click'],
  ['Snap off while dragging', 'Alt'],
  ['Zoom', `${MOD} scroll`],
  ['Pan', 'Space + drag'],
  ['Fit to screen', '1'],
]

function Rail() {
  const panel = useEditor((s) => s.panel)
  const setPanel = useEditor((s) => s.setPanel)
  return (
    <nav aria-label="Tools" className="flex w-[72px] shrink-0 flex-col items-center gap-1 border-r border-line bg-panel py-2">
      {PANELS.map(({ id, label, icon: Icon }) => (
        <button
          key={id}
          type="button"
          aria-pressed={panel === id}
          onClick={() => setPanel(panel === id ? null : id)}
          className={clsx(
            'flex h-[54px] w-[62px] flex-col items-center justify-center gap-1 rounded-lg text-[10.5px] font-medium transition-colors',
            panel === id ? 'bg-active text-fg' : 'text-muted hover:bg-hover hover:text-fg',
            id === 'designs' && 'mt-auto',
          )}
        >
          <Icon className="size-[18px]" strokeWidth={1.75} />
          {label}
        </button>
      ))}
      <Popover
        side="right"
        align="end"
        className="w-72"
        trigger={
          <IconButton label="Keyboard shortcuts" tooltipSide="right" className="mt-1">
            <Keyboard />
          </IconButton>
        }
      >
        <h2 className="mb-2 px-1 text-sm font-semibold">Shortcuts</h2>
        <dl className="space-y-0.5">
          {SHORTCUTS.map(([action, keys]) => (
            <div key={action} className="flex items-center justify-between rounded-md px-1 py-1 text-xs">
              <dt className="text-muted">{action}</dt>
              <dd className="font-mono text-[11px] text-fg">{keys}</dd>
            </div>
          ))}
        </dl>
      </Popover>
    </nav>
  )
}

function SidePanel() {
  const panel = useEditor((s) => s.panel)
  const setPanel = useEditor((s) => s.setPanel)
  const active = PANELS.find((p) => p.id === panel)
  if (!active) return null
  const View = active.view
  return (
    <aside aria-label={active.label} className="flex w-[312px] shrink-0 flex-col border-r border-line bg-panel max-md:absolute max-md:inset-y-0 max-md:left-[72px] max-md:z-20 max-md:w-[min(312px,calc(100vw-72px))] max-md:shadow-pop">
      <div className="flex h-12 shrink-0 items-center justify-between pr-2 pl-4">
        <h2 className="text-sm font-semibold">{active.label}</h2>
        <IconButton label="Close panel" onClick={() => setPanel(null)}>
          <X />
        </IconButton>
      </div>
      <div key={active.id} className="min-h-0 flex-1 overflow-y-auto px-4 pb-6">
        <View />
      </div>
    </aside>
  )
}

function useShortcuts() {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement
      // A popover or menu already handled this key (e.g. Escape to close it).
      if (e.defaultPrevented) return
      if (target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName)) return
      // Keys pressed inside an open popover, menu or slider belong to that control.
      if (target.closest('[role="dialog"], [role="listbox"], [role="menu"], [role="slider"]')) return
      const editor = useEditor.getState()
      const mod = e.metaKey || e.ctrlKey
      const key = e.key.toLowerCase()
      const done = () => e.preventDefault()

      if (mod && key === 'z') return done(), e.shiftKey ? editor.redo() : editor.undo()
      if (mod && key === 'y') return done(), editor.redo()
      if (mod && key === 'd') return done(), editor.duplicateSelected()
      if (mod && key === 'a') return done(), editor.select(editor.doc.elements.filter((el) => !el.locked && !el.hidden).map((el) => el.id))
      if (mod && key === 'c') return editor.copy()
      if (mod && key === 'x') return editor.copy(), editor.removeSelected()
      if (mod && (key === '=' || key === '+')) return done(), useView.getState().zoomTo(useView.getState().scale * 1.25)
      if (mod && key === '-') return done(), useView.getState().zoomTo(useView.getState().scale / 1.25)
      if (mod && key === '0') return done(), useView.getState().zoomTo(1)
      if (mod) return

      if (key === 'delete' || key === 'backspace') return done(), editor.removeSelected()
      if (key === 'escape') return editor.select([])
      if (key === '1') return fitView()
      if (key === ']') return editor.reorder('forward')
      if (key === '[') return editor.reorder('backward')
      // Enter on a focused button should press the button, not start editing.
      if (key === 'enter' && editor.selection.length === 1 && !target.closest('button, a')) {
        const el = editor.doc.elements.find((item) => item.id === editor.selection[0])
        if (el?.type === 'text') return done(), editor.setEditing(el.id)
      }
      const step = e.shiftKey ? 10 : 1
      const move: Record<string, [number, number]> = { arrowleft: [-step, 0], arrowright: [step, 0], arrowup: [0, -step], arrowdown: [0, step] }
      if (move[key] && editor.selection.length) return done(), editor.nudge(...move[key])
    }

    // Paste: an image from the clipboard becomes an upload; otherwise paste copied elements.
    const onPaste = (e: ClipboardEvent) => {
      const target = e.target as HTMLElement
      if (target.isContentEditable || /^(INPUT|TEXTAREA)$/.test(target.tagName)) return
      const images = [...(e.clipboardData?.files ?? [])].filter((file) => file.type.startsWith('image/'))
      if (images.length) {
        e.preventDefault()
        void addImageFiles(images)
      } else {
        useEditor.getState().paste()
      }
    }

    window.addEventListener('keydown', onKey)
    window.addEventListener('paste', onPaste)
    return () => {
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('paste', onPaste)
    }
  }, [])
}

export function Editor() {
  useShortcuts()
  // On small screens the side panel would cover the canvas, so start with it closed.
  useEffect(() => {
    if (window.innerWidth < 768) useEditor.getState().setPanel(null)
  }, [])
  const [dropping, setDropping] = useState(false)
  const hasFiles = (e: React.DragEvent) => e.dataTransfer.types.includes('Files')

  return (
    <div className="flex h-full flex-col">
      <TopBar />
      <div className="relative flex min-h-0 flex-1">
        <Rail />
        <SidePanel />
        <main
          className="workspace relative min-w-0 flex-1 overflow-hidden"
          onDragOver={(e) => hasFiles(e) && (e.preventDefault(), setDropping(true))}
          onDragLeave={(e) => e.currentTarget === e.target && setDropping(false)}
          onDrop={(e) => {
            if (!hasFiles(e)) return
            e.preventDefault()
            setDropping(false)
            void addImageFiles(e.dataTransfer.files)
          }}
        >
          <ProfileMock />
          <EditorStage />
          <ContextBar />
          <ViewBar />
          {dropping && (
            <div className="pointer-events-none absolute inset-3 z-30 flex items-center justify-center rounded-2xl border-2 border-dashed border-accent bg-accent/10 text-base font-medium backdrop-blur-sm">
              Drop to add to your banner
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
